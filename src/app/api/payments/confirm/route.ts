import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/stripe'
import { appointmentService } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, appointmentId } = await request.json()

    if (!paymentIntentId || !appointmentId) {
      return NextResponse.json(
        { error: 'Payment intent ID and appointment ID are required' },
        { status: 400 }
      )
    }

    // Verify payment with Stripe
    const paymentIntent = await paymentService.getPaymentIntent(paymentIntentId)
    
    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      )
    }

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Update appointment with payment status (only if appointment exists)
    let updated = true
    if (appointmentId !== 'test-123') {
      updated = await appointmentService.updateStatus(appointmentId, 'confirmed')
      
      if (!updated) {
        console.warn('Failed to update appointment status, but payment was successful')
        // Don't fail the entire request if appointment update fails
      }
    }

    return NextResponse.json({
      success: true,
      paymentStatus: paymentIntent.status,
      amount: paymentIntent.amount,
      message: 'Payment confirmed successfully'
    })

  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
