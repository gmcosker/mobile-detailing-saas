import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, verifyResourceOwnership } from '@/lib/auth'
import { appointmentService } from '@/lib/database'
import { smsService } from '@/lib/sms'
import { getSupabaseClient } from '@/lib/supabase'

// POST /api/appointments/[id]/cancel - Cancel appointment and notify customer
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

    // Check if already cancelled
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Appointment is already cancelled' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cancellation reason is required' },
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

    // Update appointment status to cancelled
    const updatedAppointment = await appointmentService.update(id, {
      status: 'cancelled'
    })

    if (!updatedAppointment) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel appointment' },
        { status: 500 }
      )
    }

    // Send SMS cancellation notification
    let smsResult = { success: false, error: '' }
    if (customer.phone) {
      try {
        smsResult = await smsService.sendAppointmentCancellation(
          customer.phone,
          customer.name,
          appointment.service_type,
          appointmentDate,
          appointmentTime,
          detailer.business_name,
          reason.trim()
        )
        console.log('SMS cancellation notification sent:', smsResult)
      } catch (smsError: any) {
        console.error('Error sending SMS cancellation notification:', smsError)
        smsResult = { success: false, error: smsError.message || 'Failed to send SMS' }
      }
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      notification: {
        sms: smsResult.success ? { sent: true, messageId: smsResult.messageId } : { sent: false, error: smsResult.error }
      }
    })

  } catch (error) {
    console.error('Cancel appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

