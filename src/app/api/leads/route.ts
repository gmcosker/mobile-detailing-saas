import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { kitService } from '@/lib/kit'

// POST /api/leads - Save email lead from free guide form
export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json()

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
    // Use upsert to handle duplicate emails gracefully
    const leadData = {
      email: email.toLowerCase().trim(),
      source: source || 'free_guide',
      subscribed: true,
    }
    
    const { data, error } = await supabase
      .from('leads')
      .upsert(leadData as any, {
        onConflict: 'email',
        ignoreDuplicates: false, // Update if exists
      })
      .select()
      .single()

    if (error) {
      // If it's a duplicate, that's actually okay - we already have the lead
      if (error.code === '23505') {
        console.log(`[LEADS] Email ${email} already exists in leads table`)
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
        fullError: error
      })
      
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

    // Add to ConvertKit for email nurture sequence
    const formId = process.env.CONVERTKIT_FORM_ID
    const apiKey = process.env.CONVERTKIT_API_KEY
    
    if (!apiKey) {
      console.warn('[LEADS] ⚠️ CONVERTKIT_API_KEY not set in environment variables')
    }
    
    if (!formId) {
      console.warn('[LEADS] ⚠️ CONVERTKIT_FORM_ID not set in environment variables')
    }
    
    if (formId && apiKey) {
      try {
        console.log(`[LEADS] Attempting to add ${email} to ConvertKit form ${formId}`)
        const kitResult = await kitService.addSubscriber(email, formId, {
          tags: ['free_guide', source || 'website'],
          fields: {
            source: source || 'free_guide',
          },
        })

        if (kitResult.success) {
          console.log(`[LEADS] ✅ Successfully added ${email} to ConvertKit - nurture sequence should start`)
        } else {
          console.error(`[LEADS] ❌ Failed to add ${email} to ConvertKit:`, kitResult.error)
          // Don't fail the request if Kit fails - we still saved the lead
        }
      } catch (kitError: any) {
        console.error('[LEADS] ❌ Exception adding to ConvertKit:', kitError.message || kitError)
        console.error('[LEADS] Full error:', kitError)
        // Continue even if Kit fails
      }
    } else {
      console.warn('[LEADS] ⚠️ ConvertKit not configured - missing API key or form ID. Nurture emails will NOT be sent.')
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




