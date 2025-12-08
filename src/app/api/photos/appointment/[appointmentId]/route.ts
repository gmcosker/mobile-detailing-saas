import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, verifyResourceOwnership } from '@/lib/auth'
import { photoService, appointmentService } from '@/lib/database'

// GET /api/photos/appointment/[appointmentId] - Get all photos for an appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise that needs to be awaited
    const { appointmentId } = await params
    
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify appointment exists and user has access
    const appointment = await appointmentService.getById(appointmentId)
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Verify appointment ownership
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

    // Get photos
    const photos = await photoService.getByAppointment(appointmentId)

    return NextResponse.json({
      success: true,
      photos
    })

  } catch (error) {
    console.error('Get photos error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

