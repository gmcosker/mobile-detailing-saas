import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, verifyResourceOwnership } from '@/lib/auth'
import { photoService, appointmentService } from '@/lib/database'
import { photoStorage } from '@/lib/storage'
import { getSupabaseClient } from '@/lib/supabase'

// DELETE /api/photos/[id] - Delete photo
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

    // Get photo to verify ownership
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', params.id)
      .single()

    if (photoError || !photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Verify appointment ownership
    const appointment = await appointmentService.getById(photo.appointment_id)
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

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

    // Delete photo from storage
    // Extract file path from photo.file_path (remove base URL if present)
    const filePath = photo.file_path.replace(/^https?:\/\/[^\/]+/, '')
    const storagePath = filePath.startsWith('photos/') ? filePath : `photos/${filePath}`
    
    await photoStorage.deletePhoto(storagePath)

    // Delete photo record from database
    const deleted = await photoService.delete(params.id)

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete photo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Delete photo error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

