import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, verifyResourceOwnership } from '@/lib/auth'
import { appointmentService } from '@/lib/database'
import { smsService } from '@/lib/sms'
import { getSupabaseClient } from '@/lib/supabase'

// POST /api/appointments/[id]/reminder - Send reminder SMS to customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise that needs to be awaited
    const { id } = await params
    
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get existing appointment
    const appointment = await appointmentService.getById(id)

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const hasAccess = await verifyResourceOwnership(
      appointment.detailer_id,
      auth.detailerId
    )

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if appointment is cancelled
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cannot send reminder for cancelled appointment' },
        { status: 400 }
      )
    }

    // Get customer and detailer info for notifications
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Get customer info
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', appointment.customer_id)
      .single()

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Get detailer info
    const { data: detailer } = await supabase
      .from('detailers')
      .select('*')
      .eq('id', appointment.detailer_id)
      .single()

    if (!detailer) {
      return NextResponse.json(
        { success: false, error: 'Detailer not found' },
        { status: 404 }
      )
    }

    // Format date and time for SMS
    const appointmentDate = new Date(appointment.scheduled_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    const [hours, minutes] = appointment.scheduled_time.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    const appointmentTime = `${hour12}:${minutes} ${ampm}`

    // Send SMS reminder
    let smsResult = { success: false, error: '' }
    if (customer.phone) {
      try {
        smsResult = await smsService.sendAppointmentReminder(
          customer.phone,
          customer.name,
          appointment.service_type,
          appointmentDate,
          appointmentTime,
          detailer.business_name
        )
        console.log('SMS reminder sent:', smsResult)
      } catch (smsError: any) {
        console.error('Error sending SMS reminder:', smsError)
        smsResult = { success: false, error: smsError.message || 'Failed to send SMS' }
      }
    } else {
      smsResult = { success: false, error: 'Customer phone number not available' }
    }

    return NextResponse.json({
      success: true,
      appointment,
      notification: {
        sms: smsResult.success ? { sent: true, messageId: smsResult.messageId } : { sent: false, error: smsResult.error }
      }
    })

  } catch (error) {
    console.error('Send reminder error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

