import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { paymentService } from '@/lib/stripe'

// POST /api/payments/create-link - Generate Stripe payment link
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

    const body = await request.json()
    const { amount, description, appointmentId } = body

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      )
    }

    // Create payment link
    const paymentLink = await paymentService.createPaymentLink(
      amount,
      description,
      2.9 // Platform fee percentage
    )

    if (!paymentLink) {
      return NextResponse.json(
        { success: false, error: 'Failed to create payment link' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentLink: paymentLink.id,
      url: paymentLink.url
    })

  } catch (error) {
    console.error('Create payment link error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

