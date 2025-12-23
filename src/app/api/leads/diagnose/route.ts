import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

// GET /api/leads/diagnose - Diagnose email capture issues
export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
    recommendations: []
  }

  // Check 1: Environment Variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  diagnostics.checks.envVars = {
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseAnonKey: !!supabaseAnonKey,
    supabaseUrlPrefix: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'NOT SET',
    anonKeyPrefix: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET',
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    diagnostics.errors.push('Missing Supabase environment variables')
    diagnostics.recommendations.push('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel')
  }

  // Check 2: Database Connection
  const supabase = getSupabaseClient()
  if (!supabase) {
    diagnostics.errors.push('Failed to create Supabase client')
    diagnostics.recommendations.push('Check Supabase environment variables are correct')
    return NextResponse.json({ success: false, diagnostics }, { status: 500 })
  }

  diagnostics.checks.databaseConnection = {
    connected: true,
    message: 'Supabase client created successfully'
  }

  // Check 3: Table Exists
  try {
    const { data: tableCheck, error: tableError } = await supabase
      .from('leads')
      .select('id')
      .limit(1)

    if (tableError) {
      if (tableError.code === '42P01') {
        diagnostics.errors.push('The "leads" table does not exist in your database')
        diagnostics.recommendations.push('Run the migration: database/migrations/add_leads_table.sql in Supabase SQL Editor')
      } else {
        diagnostics.errors.push(`Database error: ${tableError.message} (code: ${tableError.code})`)
      }
      diagnostics.checks.tableExists = {
        exists: false,
        error: tableError.message,
        code: tableError.code
      }
    } else {
      diagnostics.checks.tableExists = {
        exists: true,
        message: 'leads table exists'
      }
    }
  } catch (error: any) {
    diagnostics.errors.push(`Exception checking table: ${error.message}`)
    diagnostics.checks.tableExists = {
      exists: false,
      error: error.message
    }
  }

  // Check 4: Test Insert (dry run - we'll rollback)
  try {
    const testEmail = `test-${Date.now()}@diagnostic.test`
    const { data: insertData, error: insertError } = await supabase
      .from('leads')
      .insert({
        email: testEmail,
        source: 'diagnostic_test',
        subscribed: true,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '42501') {
        diagnostics.errors.push('RLS (Row Level Security) policy is blocking inserts')
        diagnostics.recommendations.push('Check that "Allow public inserts for leads" policy exists in Supabase')
        diagnostics.recommendations.push('Run this SQL in Supabase: CREATE POLICY "Allow public inserts for leads" ON leads FOR INSERT TO public WITH CHECK (true);')
      } else if (insertError.code === '23505') {
        // Duplicate - that's actually fine, means insert would work
        diagnostics.checks.testInsert = {
          success: true,
          message: 'Insert would work (duplicate email test)'
        }
      } else {
        diagnostics.errors.push(`Insert blocked: ${insertError.message} (code: ${insertError.code})`)
        diagnostics.checks.testInsert = {
          success: false,
          error: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        }
      }
    } else {
      // Success! Now delete the test record
      if (insertData?.id) {
        await supabase.from('leads').delete().eq('id', insertData.id)
        diagnostics.checks.testInsert = {
          success: true,
          message: 'Test insert succeeded - email capture should work!'
        }
      }
    }
  } catch (error: any) {
    diagnostics.errors.push(`Exception during test insert: ${error.message}`)
    diagnostics.checks.testInsert = {
      success: false,
      error: error.message
    }
  }

  // Check 5: RLS Policies
  try {
    // Try to query RLS policies (this might not work with anon key, but worth trying)
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'leads' })
      .catch(() => ({ data: null, error: { message: 'Cannot query policies with anon key' } }))

    if (policiesError) {
      diagnostics.checks.rlsPolicies = {
        accessible: false,
        message: 'Cannot check RLS policies with anon key (this is normal)',
        recommendation: 'Check manually in Supabase Dashboard → Table Editor → leads → RLS Policies'
      }
    }
  } catch (error) {
    // Ignore - we can't check policies with anon key
  }

  const hasErrors = diagnostics.errors.length > 0
  const allChecksPass = diagnostics.checks.testInsert?.success === true

  return NextResponse.json({
    success: !hasErrors && allChecksPass,
    diagnostics,
    summary: {
      status: allChecksPass ? '✅ Email capture should work' : hasErrors ? '❌ Issues found' : '⚠️ Needs verification',
      nextSteps: diagnostics.recommendations
    }
  })
}

