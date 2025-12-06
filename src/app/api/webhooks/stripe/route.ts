import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { appointmentService } from '@/lib/database'

// POST /api/webhooks/stripe - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Stripe configuration missing')
      return NextResponse.json(
        { received: false, error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    })

    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { received: false, error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { received: false, error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update appointment payment_status to 'paid'
        if (paymentIntent.metadata?.appointmentId) {
          await appointmentService.update(paymentIntent.metadata.appointmentId, {
            payment_status: 'paid',
            stripe_payment_intent_id: paymentIntent.id
          })
        }
        
        console.log('Payment succeeded:', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update appointment payment_status to 'failed'
        if (paymentIntent.metadata?.appointmentId) {
          await appointmentService.update(paymentIntent.metadata.appointmentId, {
            payment_status: 'failed',
            stripe_payment_intent_id: paymentIntent.id
          })
        }
        
        console.log('Payment failed:', paymentIntent.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { received: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

