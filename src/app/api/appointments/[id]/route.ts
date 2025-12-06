import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, verifyResourceOwnership } from '@/lib/auth'
import { appointmentService } from '@/lib/database'
import { getSupabaseClient } from '@/lib/supabase'

// GET /api/appointments/[id] - Get single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const appointment = await appointmentService.getById(params.id)

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this appointment's detailer
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

    return NextResponse.json({
      success: true,
      appointment
    })

  } catch (error) {
    console.error('Get appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/appointments/[id] - Update appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get existing appointment to verify ownership
    const existingAppointment = await appointmentService.getById(params.id)

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const hasAccess = await verifyResourceOwnership(
      existingAppointment.detailer_id,
      auth.detailerId
    )

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, notes, payment_status } = body

    // Validate status if provided
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate payment_status if provided
    const validPaymentStatuses = ['pending', 'paid', 'failed']
    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return NextResponse.json(
        { success: false, error: `Invalid payment_status. Must be one of: ${validPaymentStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Build update object
    const updates: any = {}
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (payment_status !== undefined) updates.payment_status = payment_status

    // Update appointment
    const appointment = await appointmentService.update(params.id, updates)

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Failed to update appointment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointment
    })

  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/appointments/[id] - Permanently delete cancelled appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get existing appointment to verify ownership (query directly without joins to avoid structure issues)
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, detailer_id, status')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const hasAccess = await verifyResourceOwnership(
      existingAppointment.detailer_id,
      auth.detailerId
    )

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Only allow permanent deletion if appointment is already cancelled
    if (existingAppointment.status !== 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Only cancelled appointments can be permanently deleted' },
        { status: 400 }
      )
    }

    // Permanently delete the appointment
    const deleted = await appointmentService.delete(params.id)

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete appointment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete appointment error:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

