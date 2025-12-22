import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { subscriptionService, getStripeInstance } from '@/lib/stripe'
import { detailerService } from '@/lib/database'
import { getSupabaseClient } from '@/lib/supabase'

// Map plan IDs to Stripe Price IDs
// These should be set in environment variables or fetched from Stripe
const PLAN_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || '',
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID || '',
  business: process.env.STRIPE_BUSINESS_PRICE_ID || '',
  lifetime: process.env.STRIPE_LIFETIME_PRICE_ID || '',
}

// Log Price IDs on module load (for debugging)
console.log('🔍 Stripe Price IDs loaded:', {
  starter: PLAN_PRICE_IDS.starter ? `${PLAN_PRICE_IDS.starter.substring(0, 12)}...` : 'MISSING',
  professional: PLAN_PRICE_IDS.professional ? `${PLAN_PRICE_IDS.professional.substring(0, 12)}...` : 'MISSING',
  business: PLAN_PRICE_IDS.business ? `${PLAN_PRICE_IDS.business.substring(0, 12)}...` : 'MISSING',
  lifetime: PLAN_PRICE_IDS.lifetime ? `${PLAN_PRICE_IDS.lifetime.substring(0, 12)}...` : 'MISSING',
})

// POST /api/subscriptions/create-checkout - Create Stripe Checkout Session for subscription
// Supports both authenticated users (upgrading) and anonymous visitors (new customers)
export async function POST(request: NextRequest) {
  try {
    const { planId, detailerId } = await request.json()

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // If detailerId is provided, verify authentication and ownership
    let auth = null
    if (detailerId) {
      auth = await verifyAuth(request)
      if (!auth) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      // Verify user owns detailerId
      if (detailerId !== auth.detailerId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    // Get price ID for plan
    const priceId = PLAN_PRICE_IDS[planId.toLowerCase()]
    if (!priceId || priceId.trim() === '' || !priceId.startsWith('price_')) {
      console.error('❌ Invalid or missing Price ID:', { 
        planId, 
        priceId, 
        envVar: `STRIPE_${planId.toUpperCase()}_PRICE_ID`,
        availablePlans: Object.keys(PLAN_PRICE_IDS),
        allPriceIds: PLAN_PRICE_IDS
      })
      return NextResponse.json(
        { success: false, error: `Price ID not configured for plan "${planId}". Please set STRIPE_${planId.toUpperCase()}_PRICE_ID in your environment variables.` },
        { status: 400 }
      )
    }
    
    console.log('Creating checkout for plan:', { planId, priceId, detailerId: detailerId || 'NEW_CUSTOMER' })

    // For authenticated users, get their detailer info and use existing customer if available
    // For new customers, Stripe will create the customer during checkout
    let stripeCustomerId: string | undefined = undefined
    let customerEmail: string | undefined = undefined

    if (detailerId) {
      // Existing user - get their info
      const detailer = await detailerService.getByDetailerId(detailerId)
      if (!detailer) {
        return NextResponse.json(
          { success: false, error: 'Detailer not found' },
          { status: 404 }
        )
      }

      customerEmail = detailer.email

      // Check if existing customer ID is valid for current mode (test vs live)
      stripeCustomerId = detailer.stripe_customer_id || undefined
      const keyMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test'

      if (stripeCustomerId) {
        // Verify the existing customer exists in the correct mode
        try {
          const existingCustomer = await stripeInstance.customers.retrieve(stripeCustomerId)
          const customerMode = existingCustomer.livemode ? 'live' : 'test'
          
          if (keyMode !== customerMode) {
            console.log(`⚠️ Customer ${stripeCustomerId} is in ${customerMode} mode but API key is ${keyMode} mode. Will create new customer.`)
            stripeCustomerId = undefined // Force creation of new customer in correct mode
          }
        } catch (error: any) {
          // Customer doesn't exist or is in wrong mode - create new one
          console.log(`⚠️ Customer ${stripeCustomerId} not found or invalid. Will create new customer.`)
          stripeCustomerId = undefined
        }
      }
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
    const successUrl = `${baseUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/upgrade?canceled=true`

    // Check if this is a lifetime deal (one-time payment) or subscription
    const isLifetime = planId.toLowerCase() === 'lifetime'
    
    console.log('Creating checkout session:', {
      isLifetime,
      priceId,
      stripeCustomerId,
      successUrl,
      cancelUrl
    })
    
    // First, verify the Price ID exists and is accessible
    const stripeInstance = getStripeInstance()
    if (stripeInstance) {
      try {
        console.log('🔍 Verifying Price ID exists:', priceId)
        const price = await stripeInstance.prices.retrieve(priceId)
        console.log('✅ Price ID verified:', {
          id: price.id,
          active: price.active,
          type: price.type,
          mode: price.livemode ? 'live' : 'test'
        })
        
        // Check if price is active
        if (!price.active) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Price ID "${priceId}" exists but is archived/inactive. Please activate it in your Stripe Dashboard.`
            },
            { status: 400 }
          )
        }
        
        // Check mode mismatch
        const keyMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test'
        const priceMode = price.livemode ? 'live' : 'test'
        if (keyMode !== priceMode) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Mode mismatch: Your Stripe key is in ${keyMode} mode, but Price ID "${priceId}" is in ${priceMode} mode. They must match. Please use a ${keyMode} mode Price ID or switch your API key to ${priceMode} mode.`
            },
            { status: 400 }
          )
        }
      } catch (verifyError: any) {
        console.error('❌ Price ID verification failed:', verifyError)
        const keyMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test'
        return NextResponse.json(
          { 
            success: false, 
            error: `Price ID "${priceId}" not found or not accessible. Your API key is in ${keyMode} mode - make sure the Price ID is also in ${keyMode} mode. Error: ${verifyError.message}`
          },
          { status: 400 }
        )
      }
    }

    let session
    try {
      // For new customers (no detailerId), pass undefined for customer and let Stripe create it
      // For existing customers, use their customer ID
      session = isLifetime
        ? await subscriptionService.createOneTimeCheckoutSession(
            stripeCustomerId,
            priceId,
            detailerId || 'new_customer',
            successUrl,
            cancelUrl,
            customerEmail
          )
        : await subscriptionService.createCheckoutSession(
            stripeCustomerId,
            priceId,
            detailerId || 'new_customer',
            successUrl,
            cancelUrl,
            customerEmail
          )
    } catch (stripeError: any) {
      console.error('❌ Stripe API error:', stripeError)
      const errorMessage = stripeError.message || 'Unknown Stripe error'
      const errorCode = stripeError.code || 'unknown'
      const errorType = stripeError.type || 'unknown'
      
      // Check for common errors
      let userFriendlyMessage = errorMessage
      if (errorCode === 'resource_missing' || errorMessage.includes('No such price')) {
        const keyMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test'
        userFriendlyMessage = `Price ID "${priceId}" not found in ${keyMode} mode. Check if the Price ID is in the correct mode (test vs live) in your Stripe Dashboard.`
      } else if (errorMessage.includes('test mode') || errorMessage.includes('live mode')) {
        userFriendlyMessage = `Mode mismatch: Your Stripe key and Price ID must both be in the same mode (test or live). ${errorMessage}`
      } else if (errorCode === 'invalid_request_error') {
        userFriendlyMessage = `Invalid request: ${errorMessage}`
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: userFriendlyMessage,
          stripeError: {
            code: errorCode,
            type: errorType,
            message: errorMessage
          }
        },
        { status: 500 }
      )
    }

    if (!session) {
      console.error('❌ Failed to create checkout session - session is null')
      console.error('Debug info:', {
        priceId,
        planId,
        isLifetime,
        stripeCustomerId,
        hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
        stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
        allEnvVars: {
          STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING',
          STRIPE_PROFESSIONAL_PRICE_ID: process.env.STRIPE_PROFESSIONAL_PRICE_ID ? `${process.env.STRIPE_PROFESSIONAL_PRICE_ID.substring(0, 12)}...` : 'MISSING',
          STRIPE_STARTER_PRICE_ID: process.env.STRIPE_STARTER_PRICE_ID ? 'SET' : 'MISSING',
          STRIPE_BUSINESS_PRICE_ID: process.env.STRIPE_BUSINESS_PRICE_ID ? 'SET' : 'MISSING',
          STRIPE_LIFETIME_PRICE_ID: process.env.STRIPE_LIFETIME_PRICE_ID ? 'SET' : 'MISSING',
        }
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create checkout session. Check server logs (terminal) for detailed error. Common issues: Price ID not set in .env.local, Price ID doesn\'t exist in Stripe, or key/price mismatch (test vs live).' 
        },
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

