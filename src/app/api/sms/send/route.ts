import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { smsService } from '@/lib/sms'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { phoneNumber, message, customerId } = await request.json()

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

    // Get detailer UUID from detailer_id string
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data: detailerData, error: detailerError } = await supabase
      .from('detailers')
      .select('id, business_name')
      .eq('detailer_id', auth.detailerId)
      .single()

    if (detailerError || !detailerData) {
      return NextResponse.json(
        { error: 'Detailer not found' },
        { status: 404 }
      )
    }

    // Verify customer access if customerId provided
    if (customerId) {
      const verification = await smsService.verifyCustomerAccess(customerId, detailerData.id)
      if (!verification.valid) {
        return NextResponse.json(
          { error: verification.error || 'Customer does not belong to this detailer' },
          { status: 403 }
        )
      }
    }

    const result = await smsService.sendSMS(
      phoneNumber, 
      message, 
      detailerData.id,
      { 
        businessName: detailerData.business_name,
        customerId: customerId 
      }
    )
    
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
