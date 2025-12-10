import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'
import { detailerService } from '@/lib/database'
import { isValidEmail, isValidPhone } from '@/lib/auth'
import { generateDetailerId } from '@/lib/database'

// POST /api/auth/signup - Create new detailer account
// Trigger redeploy to pick up environment variables
export async function POST(request: NextRequest) {
  try {
    const { email, password, business_name, contact_name, phone } = await request.json()

    // Validation
    if (!email || !password || !business_name || !contact_name || !phone) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      )
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Valid phone number is required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Create Supabase client for Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Check if detailer with this email already exists
    const dbClient = getSupabaseClient()
    if (!dbClient) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data: existingDetailer } = await dbClient
      .from('detailers')
      .select('id')
      .eq('email', email)
      .single()

    if (existingDetailer) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Generate unique detailer_id from business name
    let detailerId = generateDetailerId(business_name)
    
    // Ensure unique detailer_id
    let finalDetailerId = detailerId
    let counter = 1
    while (true) {
      const { data: existing } = await dbClient
        .from('detailers')
        .select('id')
        .eq('detailer_id', finalDetailerId)
        .single()
      
      if (!existing) break
      finalDetailerId = `${detailerId}-${counter}`
      counter++
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined // No email confirmation for MVP
      }
    })

    if (authError || !authData.user) {
      // Check if user already exists
      if (authError?.message?.includes('already registered') || authError?.message?.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: authError?.message || 'Failed to create account' },
        { status: 400 }
      )
    }

    // Auto-confirm user for MVP/testing (bypass email confirmation)
    // Use service role key if available to confirm the user immediately
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let sessionToken = authData.session?.access_token
    
    // Always try to sign in to get a valid session token
    // This ensures we have a valid JWT even if signup didn't return one
    try {
      const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (sessionData?.session?.access_token) {
        sessionToken = sessionData.session.access_token
      } else if (signInError) {
        console.error('Error signing in after signup:', signInError)
        
        // If sign-in fails, try using service role to confirm user first
        if (serviceRoleKey && authData.user) {
          try {
            const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            })
            
            // Update user to confirmed status (bypass email confirmation)
            await adminSupabase.auth.admin.updateUserById(authData.user.id, {
              email_confirm: true
            })
            
            // Try signing in again after confirmation
            const { data: retrySession } = await supabase.auth.signInWithPassword({
              email,
              password
            })
            
            if (retrySession?.session?.access_token) {
              sessionToken = retrySession.session.access_token
            }
          } catch (confirmError) {
            console.error('Error auto-confirming user:', confirmError)
          }
        }
      }
    } catch (signInError) {
      console.error('Error during sign-in after signup:', signInError)
    }
    
    // If we still don't have a token, use detailer_id as fallback
    // (This will work with the fallback in verifyAuth)
    if (!sessionToken) {
      console.warn('No session token available, using detailer_id as fallback')
    }

    // Create detailer record
    const detailer = await detailerService.create({
      business_name,
      contact_name,
      email,
      phone,
      detailer_id: finalDetailerId,
      is_active: true
    })

    if (!detailer) {
      // Note: Auth user was created but detailer wasn't - this is an edge case
      // For MVP, we'll log it and return error. In production, you might want
      // to add a cleanup job or manual process to handle orphaned auth users.
      console.error('Detailer creation failed after auth user creation for email:', email)
      return NextResponse.json(
        { success: false, error: 'Failed to create detailer account. Please contact support.' },
        { status: 500 }
      )
    }

    // Set trial dates for new accounts (14-day free trial)
    const trialStartedAt = new Date().toISOString()
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
    
    const trialUpdated = await detailerService.update(detailer.id, {
      trial_started_at: trialStartedAt,
      trial_ends_at: trialEndsAt,
      subscription_status: 'trial'
    })

    if (!trialUpdated) {
      console.warn('Failed to set trial dates for detailer:', detailer.id)
      // Don't fail signup if trial update fails - account is still created
    }

    // Return user info and session token
    return NextResponse.json({
      success: true,
      user: {
        id: detailer.id,
        detailer_id: detailer.detailer_id,
        business_name: detailer.business_name,
        email: detailer.email
      },
      token: sessionToken || detailer.detailer_id
    }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

