import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getStripeInstance } from '@/lib/stripe'
import Stripe from 'stripe'

// GET /api/subscriptions/verify-session - Verify a Stripe checkout session
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const stripe = getStripeInstance()
    if (!stripe) {
      return NextResponse.json(
        { success: false, error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Verify the session belongs to this user
    const detailerId = session.metadata?.detailer_id
    if (detailerId !== auth.detailerId) {
      return NextResponse.json(
        { success: false, error: 'Session does not belong to this user' },
        { status: 403 }
      )
    }

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        session: {
          id: session.id,
          payment_status: session.payment_status,
          mode: session.mode,
        },
        detailer_id: detailerId,
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Payment not completed',
      payment_status: session.payment_status,
    })

  } catch (error) {
    console.error('Verify session error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

