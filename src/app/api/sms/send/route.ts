import { NextRequest, NextResponse } from 'next/server'
import { smsService } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

    const result = await smsService.sendSMS(phoneNumber, message)
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        messageId: result.messageId,
        message: 'SMS sent successfully' 
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('SMS API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
