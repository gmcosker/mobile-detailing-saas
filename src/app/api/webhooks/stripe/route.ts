import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { appointmentService, detailerService } from '@/lib/database'
import { getSupabaseClient } from '@/lib/supabase'

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

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const detailerId = subscription.metadata?.detailer_id

        if (detailerId) {
          const supabase = getSupabaseClient()
          if (supabase) {
            // Resolve detailer UUID
            const { data: detailer } = await supabase
              .from('detailers')
              .select('id')
              .eq('detailer_id', detailerId)
              .single()

            if (detailer) {
              // Determine plan from price ID
              const priceId = subscription.items.data[0]?.price?.id
              let plan: 'starter' | 'professional' | 'business' | null = null
              
              if (priceId === process.env.STRIPE_STARTER_PRICE_ID) {
                plan = 'starter'
              } else if (priceId === process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
                plan = 'professional'
              } else if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) {
                plan = 'business'
              }

              await supabase
                .from('detailers')
                .update({
                  subscription_status: 'active',
                  stripe_subscription_id: subscription.id,
                  subscription_plan: plan,
                  subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
                })
                .eq('id', detailer.id)

              console.log('Subscription created:', subscription.id, 'for detailer:', detailerId)
            }
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const detailerId = subscription.metadata?.detailer_id

        if (detailerId) {
          const supabase = getSupabaseClient()
          if (supabase) {
            const { data: detailer } = await supabase
              .from('detailers')
              .select('id')
              .eq('detailer_id', detailerId)
              .single()

            if (detailer) {
              // Determine plan from price ID
              const priceId = subscription.items.data[0]?.price?.id
              let plan: 'starter' | 'professional' | 'business' | null = null
              
              if (priceId === process.env.STRIPE_STARTER_PRICE_ID) {
                plan = 'starter'
              } else if (priceId === process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
                plan = 'professional'
              } else if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) {
                plan = 'business'
              }

              await supabase
                .from('detailers')
                .update({
                  subscription_status: subscription.status === 'active' ? 'active' : 'cancelled',
                  subscription_plan: plan,
                  subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
                })
                .eq('id', detailer.id)

              console.log('Subscription updated:', subscription.id)
            }
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const detailerId = subscription.metadata?.detailer_id

        if (detailerId) {
          const supabase = getSupabaseClient()
          if (supabase) {
            const { data: detailer } = await supabase
              .from('detailers')
              .select('id')
              .eq('detailer_id', detailerId)
              .single()

            if (detailer) {
              await supabase
                .from('detailers')
                .update({
                  subscription_status: 'cancelled',
                  subscription_ends_at: new Date().toISOString(),
                })
                .eq('id', detailer.id)

              console.log('Subscription cancelled:', subscription.id)
            }
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const detailerId = subscription.metadata?.detailer_id

          if (detailerId) {
            const supabase = getSupabaseClient()
            if (supabase) {
              const { data: detailer } = await supabase
                .from('detailers')
                .select('id')
                .eq('detailer_id', detailerId)
                .single()

              if (detailer) {
                // Update subscription end date (renewal)
                await supabase
                  .from('detailers')
                  .update({
                    subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
                    subscription_status: 'active',
                  })
                  .eq('id', detailer.id)

                console.log('Invoice payment succeeded, subscription renewed:', subscriptionId)
              }
            }
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          console.log('Invoice payment failed for subscription:', subscriptionId)
          // Optionally: send email notification, update status, etc.
        }
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

