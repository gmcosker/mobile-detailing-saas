import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { subscriptionService } from '@/lib/stripe'
import { detailerService } from '@/lib/database'
import { getSupabaseClient } from '@/lib/supabase'

// Map plan IDs to Stripe Price IDs
// These should be set in environment variables or fetched from Stripe
const PLAN_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
  business: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business',
}

// POST /api/subscriptions/create-checkout - Create Stripe Checkout Session for subscription
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { planId, detailerId } = await request.json()

    if (!planId || !detailerId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID and detailer ID are required' },
        { status: 400 }
      )
    }

    // Verify user owns detailerId
    if (detailerId !== auth.detailerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get price ID for plan
    const priceId = PLAN_PRICE_IDS[planId.toLowerCase()]
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Get detailer info
    const detailer = await detailerService.getByDetailerId(detailerId)
    if (!detailer) {
      return NextResponse.json(
        { success: false, error: 'Detailer not found' },
        { status: 404 }
      )
    }

    // Create or get Stripe customer
    let stripeCustomerId = detailer.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await subscriptionService.createCustomer(
        detailer.email,
        detailer.business_name,
        { detailer_id: detailerId }
      )

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Failed to create Stripe customer' },
          { status: 500 }
        )
      }

      stripeCustomerId = customer.id

      // Update detailer with Stripe customer ID
      const supabase = getSupabaseClient()
      if (supabase) {
        await supabase
          .from('detailers')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', detailer.id)
      }
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
    const successUrl = `${baseUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/upgrade?canceled=true`

    const session = await subscriptionService.createCheckoutSession(
      stripeCustomerId,
      priceId,
      detailerId,
      successUrl,
      cancelUrl
    )

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    })

  } catch (error) {
    console.error('Create checkout session error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

