import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/stripe'
import { appointmentService } from '@/lib/database'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd', appointmentId, customerId } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // Get appointment to find detailer's Stripe Connect account
    let stripeAccountId: string | undefined = undefined
    
    if (appointmentId) {
      const appointment = await appointmentService.getById(appointmentId)
      if (appointment) {
        // Get detailer's Stripe Connect account ID
        const supabase = getSupabaseClient()
        if (supabase) {
          const { data: detailer } = await supabase
            .from('detailers')
            .select('stripe_account_id')
            .eq('id', appointment.detailer_id)
            .single()

          if (detailer?.stripe_account_id) {
            stripeAccountId = detailer.stripe_account_id
            console.log(`[PAYMENT] Using Stripe Connect account: ${stripeAccountId}`)
          } else {
            console.warn(`[PAYMENT] Detailer ${appointment.detailer_id} does not have Stripe Connect account set up`)
            // Continue without Connect - payment will go to platform account
            // In production, you might want to return an error here
          }
        }
      }
    }

    // Calculate platform fee (2.9% + $0.30)
    // If using Connect, this fee goes to platform, rest goes to detailer
    const platformFee = paymentService.calculatePlatformFee(amount, 2.9)
    
    // Prepare metadata with appointment ID if provided
    const metadata = appointmentId ? { appointmentId } : undefined
    
    const paymentIntent = await paymentService.createPaymentIntent(
      amount,
      currency,
      platformFee,
      stripeAccountId, // Pass Connect account ID if available
      metadata
    )

    if (!paymentIntent) {
      return NextResponse.json(
        { success: false, error: 'Failed to create payment intent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      platformFee: Math.round(platformFee * 100) // Return in cents
    })

  } catch (error) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}


