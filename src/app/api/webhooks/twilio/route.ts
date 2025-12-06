import { NextRequest, NextResponse } from 'next/server'

// POST /api/webhooks/twilio - Handle Twilio SMS status webhooks
export async function POST(request: NextRequest) {
  try {
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN

    if (!twilioAuthToken) {
      console.error('Twilio auth token not configured')
      return NextResponse.json(
        { received: false, error: 'Twilio not configured' },
        { status: 500 }
      )
    }

    // Get form data from Twilio webhook
    const formData = await request.formData()
    const messageSid = formData.get('MessageSid') as string
    const messageStatus = formData.get('MessageStatus') as string
    const errorCode = formData.get('ErrorCode') as string
    const errorMessage = formData.get('ErrorMessage') as string

    // Verify Twilio signature
    const twilioSignature = request.headers.get('x-twilio-signature')
    const url = request.url

    if (twilioSignature) {
      // In production, verify the signature using Twilio's validation
      // For now, we'll log the webhook data
      // TODO: Implement proper signature verification
      // const { validateRequest } = await import('twilio')
      // const isValid = validateRequest(twilioAuthToken, twilioSignature, url, formData)
      // if (!isValid) {
      //   return NextResponse.json(
      //     { received: false, error: 'Invalid signature' },
      //     { status: 403 }
      //   )
      // }
    }

    // Log webhook data for tracking
    console.log('Twilio webhook received:', {
      messageSid,
      messageStatus,
      errorCode,
      errorMessage
    })

    // Handle different status updates
    switch (messageStatus) {
      case 'delivered':
        console.log(`SMS ${messageSid} delivered successfully`)
        // TODO: Update database record if tracking SMS delivery
        break

      case 'failed':
      case 'undelivered':
        console.error(`SMS ${messageSid} failed:`, errorMessage || errorCode)
        // TODO: Update database record, notify user, etc.
        break

      case 'sent':
        console.log(`SMS ${messageSid} sent`)
        break

      default:
        console.log(`SMS ${messageSid} status: ${messageStatus}`)
    }

    // Return success response to Twilio
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Twilio webhook error:', error)
    return NextResponse.json(
      { received: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

