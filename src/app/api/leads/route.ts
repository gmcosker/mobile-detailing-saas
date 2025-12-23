import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { sendfoxService } from '@/lib/sendfox'

// POST /api/leads - Save email lead from free guide form
export async function POST(request: NextRequest) {
  try {
    const { firstName, email, source } = await request.json()

    if (!firstName || firstName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'First name is required' },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Insert lead into database
    // Try simple insert first - if duplicate, handle gracefully
    const leadData = {
      first_name: firstName.trim(),
      email: email.toLowerCase().trim(),
      source: source || 'free_guide',
      subscribed: true,
    }
    
    // First, try a simple insert
    const { data, error } = await supabase
      .from('leads')
      .insert(leadData as any)
      .select()
      .single()

    if (error) {
      // If it's a duplicate, that's actually okay - we already have the lead
      if (error.code === '23505') {
        console.log(`[LEADS] Email ${email} already exists in leads table - that's fine`)
        return NextResponse.json({
          success: true,
          message: 'Email already registered',
          lead: { email: email.toLowerCase().trim() }
        })
      }

      // Log the full error details for debugging
      console.error('[LEADS] ❌ Database error saving lead:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2)
      })
      
      // Check if table doesn't exist (common error code)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.error('[LEADS] ❌❌❌ THE LEADS TABLE DOES NOT EXIST IN YOUR DATABASE! ❌❌❌')
        console.error('[LEADS] You need to run the migration: database/migrations/add_leads_table.sql')
      }
      
      // Check if RLS is blocking (common error)
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
        console.error('[LEADS] ❌❌❌ RLS POLICY IS BLOCKING THE INSERT! ❌❌❌')
        console.error('[LEADS] Check that the "Allow public inserts for leads" policy exists in Supabase')
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to save email',
          details: error.message || 'Database error',
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log(`[LEADS] Successfully saved lead: ${email}`)

    // Add to SendFox for email marketing
    const listId = process.env.SENDFOX_LIST_ID
    const apiToken = process.env.SENDFOX_API_TOKEN
    
    if (!apiToken) {
      console.warn('[LEADS] ⚠️ SENDFOX_API_TOKEN not set in environment variables')
    }
    
    if (!listId) {
      console.warn('[LEADS] ⚠️ SENDFOX_LIST_ID not set in environment variables')
    }
    
    if (listId && apiToken) {
      try {
        console.log(`[LEADS] Attempting to add ${email} to SendFox list ${listId}`)
        const sendfoxResult = await sendfoxService.addSubscriber(email, listId, {
          firstName: firstName.trim(),
          fields: {
            source: source || 'free_guide',
          },
        })

        if (sendfoxResult.success) {
          console.log(`[LEADS] ✅ Successfully added ${email} to SendFox - email marketing sequence should start`)
        } else {
          console.error(`[LEADS] ❌ Failed to add ${email} to SendFox:`, sendfoxResult.error)
          // Don't fail the request if SendFox fails - we still saved the lead
        }
      } catch (sendfoxError: any) {
        console.error('[LEADS] ❌ Exception adding to SendFox:', sendfoxError.message || sendfoxError)
        console.error('[LEADS] Full error:', sendfoxError)
        // Continue even if SendFox fails
      }
    } else {
      console.warn('[LEADS] ⚠️ SendFox not configured - missing API token or list ID. Marketing emails will NOT be sent.')
    }

    return NextResponse.json({
      success: true,
      message: 'Email saved successfully',
      lead: data
    })

  } catch (error: any) {
    console.error('[LEADS] Error in leads API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/leads - Get all leads (for admin/dashboard - requires auth in production)
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[LEADS] Error fetching leads:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      leads: data,
      count: data?.length || 0
    })

  } catch (error: any) {
    console.error('[LEADS] Error in leads GET API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}




