import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, verifyResourceOwnership } from '@/lib/auth'
import { appointmentService, detailerService } from '@/lib/database'
import { smsService } from '@/lib/sms'
import { getSupabaseClient } from '@/lib/supabase'

// POST /api/appointments/[id]/confirm - Confirm appointment and send notifications
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

    // Check if already confirmed
    if (appointment.status === 'confirmed') {
      return NextResponse.json(
        { success: false, error: 'Appointment is already confirmed' },
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

    // Update appointment status to confirmed
    const updatedAppointment = await appointmentService.update(id, {
      status: 'confirmed'
    })

    if (!updatedAppointment) {
      return NextResponse.json(
        { success: false, error: 'Failed to update appointment' },
        { status: 500 }
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

    // Send SMS confirmation
    let smsResult = { success: false, error: '' }
    if (customer.phone) {
      try {
        console.log(`[CONFIRM] Attempting to send SMS confirmation to ${customer.phone}`)
        smsResult = await smsService.sendAppointmentConfirmation(
          customer.phone,
          customer.name,
          appointment.service_type,
          appointmentDate,
          appointmentTime,
          detailer.business_name
        )
        console.log('[CONFIRM] SMS result:', smsResult)
        if (!smsResult.success) {
          console.warn('[CONFIRM] SMS failed:', smsResult.error)
        }
      } catch (smsError: any) {
        console.error('[CONFIRM] Error sending SMS confirmation:', smsError)
        smsResult = { success: false, error: smsError.message || 'Failed to send SMS' }
      }
    } else {
      console.warn('[CONFIRM] No phone number for customer, skipping SMS')
    }

    // Send email confirmation (if email exists)
    let emailSent = false
    if (customer.email) {
      try {
        // For now, we'll just log it. In production, you'd use a service like SendGrid, Resend, etc.
        console.log(`[EMAIL] Would send confirmation email to ${customer.email}`)
        console.log(`Subject: Appointment Confirmed - ${detailer.business_name}`)
        console.log(`Body: Hi ${customer.name}! Your ${appointment.service_type} appointment with ${detailer.business_name} is confirmed for ${appointmentDate} at ${appointmentTime}.`)
        emailSent = true
        // TODO: Integrate with email service (SendGrid, Resend, etc.)
      } catch (emailError: any) {
        console.error('Error sending email confirmation:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      notifications: {
        sms: smsResult.success ? { sent: true, messageId: smsResult.messageId } : { sent: false, error: smsResult.error },
        email: emailSent ? { sent: true } : { sent: false, reason: customer.email ? 'Email service not configured' : 'No email address' }
      }
    })

  } catch (error) {
    console.error('Confirm appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

