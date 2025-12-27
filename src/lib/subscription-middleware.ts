import { NextResponse } from 'next/server'
import { hasActiveAccess } from './subscription'
import { getSupabaseClient } from './supabase'

/**
 * Middleware to check if user has active subscription access
 * Returns 402 Payment Required if subscription is expired
 */
export async function checkSubscriptionAccess(detailerId: string): Promise<NextResponse | null> {
  // Bypass subscription check for specific email
  const supabase = getSupabaseClient()
  if (supabase) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(detailerId)
    let query = supabase
      .from('detailers')
      .select('email')
      .eq(isUuid ? 'id' : 'detailer_id', detailerId)
      .single()
    
    const { data: detailer } = await query
    
    if (detailer?.email === 'garrity2mcosker@gmail.com') {
      return null // Bypass check for this email
    }
  }
  
  const hasAccess = await hasActiveAccess(detailerId)
  
  if (!hasAccess) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Subscription required',
        message: 'Your trial has ended. Please upgrade to continue using DetailFlow.'
      },
      { status: 402 } // Payment Required
    )
  }
  
  return null // Access granted
}

