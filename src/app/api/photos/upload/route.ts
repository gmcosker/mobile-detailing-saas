import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, verifyResourceOwnership } from '@/lib/auth'
import { photoService, appointmentService } from '@/lib/database'
import { photoStorage, imageValidation } from '@/lib/storage'

// POST /api/photos/upload - Upload photo with server-side validation
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const appointmentId = formData.get('appointmentId') as string
    const photoType = formData.get('photoType') as string

    // Validation
    if (!file || !appointmentId || !photoType) {
      return NextResponse.json(
        { success: false, error: 'File, appointmentId, and photoType are required' },
        { status: 400 }
      )
    }

    // Validate photoType enum
    const validPhotoTypes = ['before', 'after', 'during']
    if (!validPhotoTypes.includes(photoType)) {
      return NextResponse.json(
        { success: false, error: `photoType must be one of: ${validPhotoTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!imageValidation.isValidImage(file)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (!imageValidation.isValidSize(file, 10)) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
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

    // Upload photo to storage
    const filePath = await photoStorage.uploadPhoto(file, appointmentId, photoType as 'before' | 'after' | 'during')

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Failed to upload photo' },
        { status: 500 }
      )
    }

    // Create photo record in database
    const photo = await photoService.create({
      appointment_id: appointmentId,
      file_path: filePath,
      file_name: file.name,
      photo_type: photoType as 'before' | 'after' | 'during',
      file_size: file.size,
      mime_type: file.type
    })

    if (!photo) {
      // TODO: Rollback file upload if database insert fails
      return NextResponse.json(
        { success: false, error: 'Failed to create photo record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      photo,
      url: filePath
    }, { status: 201 })

  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

