import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd', appointmentId, customerId } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // Calculate platform fee (2.9% + $0.30)
    const platformFee = paymentService.calculatePlatformFee(amount, 2.9)
    
    const paymentIntent = await paymentService.createPaymentIntent(
      amount,
      currency,
      platformFee
    )

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Failed to create payment intent' },
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
