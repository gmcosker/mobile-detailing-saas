import { NextResponse } from 'next/server'
import { hasActiveAccess } from './subscription'

/**
 * Middleware to check if user has active subscription access
 * Returns 402 Payment Required if subscription is expired
 */
export async function checkSubscriptionAccess(detailerId: string): Promise<NextResponse | null> {
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

