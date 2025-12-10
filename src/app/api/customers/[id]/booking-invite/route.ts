import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { customerService } from '@/lib/database'
import { smsService } from '@/lib/sms'
import { getSupabaseClient } from '@/lib/supabase'

// POST /api/customers/[id]/booking-invite - Send booking invite SMS and track it
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: customerId } = await params
    const { message, detailerId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get customer
    const customer = await customerService.getById(customerId)
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Verify customer belongs to detailer's appointments
    const { appointmentService } = await import('@/lib/database')
    const appointments = await appointmentService.getByDetailer(auth.detailerId, 100)
    const hasAccess = appointments.some(apt => apt.customer_id === customerId)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (!customer.phone) {
      return NextResponse.json(
        { success: false, error: 'Customer phone number is required' },
        { status: 400 }
      )
    }

    // Send SMS
    const result = await smsService.sendSMS(customer.phone, message)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send SMS' },
        { status: 500 }
      )
    }

    // Update customer's last_booking_invite_sent_at timestamp
    const supabase = getSupabaseClient()
    if (!supabase) {
      // SMS was sent but we couldn't track it - still return success
      console.warn('Could not update booking invite timestamp - database connection failed')
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'SMS sent successfully (tracking update failed)'
      })
    }

    const { error: updateError } = await supabase
      .from('customers')
      .update({ 
        last_booking_invite_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)

    if (updateError) {
      console.error('Error updating booking invite timestamp:', updateError)
      // SMS was sent but we couldn't track it - still return success
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'SMS sent successfully (tracking update failed)'
      })
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'SMS sent successfully',
      lastBookingInviteSentAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Booking invite API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

