import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'
import { isValidEmail } from '@/lib/auth'

// TODO: Add rate limiting (5 attempts per 15 minutes)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
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

    // Verify password with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    // Always return generic error message (don't reveal if email exists)
    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Fetch detailer by email to get detailer info
    const dbClient = getSupabaseClient()
    if (!dbClient) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data: detailer, error: detailerError } = await dbClient
      .from('detailers')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (detailerError || !detailer) {
      // Auth succeeded but detailer not found - this shouldn't happen in normal flow
      // but return generic error for security
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
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
      token: authData.session?.access_token || detailer.detailer_id // Use JWT token from Supabase Auth
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

