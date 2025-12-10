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

    // Verify customer belongs to detailer
    // Since the customer list is already filtered by detailer (via appointments),
    // if a customer appears in the list, they have access. We'll verify by checking
    // if they have any appointments with this detailer (including placeholder appointments)
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Get detailer UUID from detailer_id string
    const { data: detailerData, error: detailerError } = await supabase
      .from('detailers')
      .select('id')
      .eq('detailer_id', auth.detailerId)
      .single()

    if (detailerError || !detailerData) {
      return NextResponse.json(
        { success: false, error: 'Detailer not found' },
        { status: 404 }
      )
    }

    // Check if customer has any appointments with this detailer
    // This includes placeholder appointments for manually added customers
    const { data: appointmentData, error: appointmentError } = await supabase
      .from('appointments')
      .select('id')
      .eq('detailer_id', detailerData.id)
      .eq('customer_id', customerId)
      .limit(1)
      .maybeSingle()

    // Verify access: customer must have at least one appointment with this detailer
    // (including placeholder appointments for manually added customers)
    if (appointmentError) {
      console.error('Error checking appointment access:', appointmentError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify customer access' },
        { status: 500 }
      )
    }

    // If no appointment found, deny access
    // This ensures customers can only receive invites if they're linked to this detailer
    if (!appointmentData) {
      return NextResponse.json(
        { success: false, error: 'Customer not found in your customer list' },
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
    // Reuse the supabase client we already have
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
      // Check if error is due to missing column
      const isColumnMissing = updateError.message?.includes('column') && 
                              updateError.message?.includes('does not exist')
      
      // SMS was sent but we couldn't track it - still return success
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'SMS sent successfully (tracking update failed)',
        error: updateError.message,
        columnMissing: isColumnMissing || false
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

