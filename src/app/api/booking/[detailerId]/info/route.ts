import { NextRequest, NextResponse } from 'next/server'
import { detailerService, brandingService, serviceService, appointmentService } from '@/lib/database'

// GET /api/booking/[detailerId]/info - Get detailer info, branding, and services for public booking page
// This is a PUBLIC endpoint (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ detailerId: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise that needs to be awaited
    const { detailerId } = await params
    
    if (!detailerId || typeof detailerId !== 'string' || detailerId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid detailer ID' },
        { status: 400 }
      )
    }
    
    // Verify detailer exists and is active
    const detailer = await detailerService.getByDetailerId(detailerId.trim())
    
    if (!detailer) {
      return NextResponse.json(
        { success: false, error: 'Booking page not found. Please check your booking link.' },
        { status: 404 }
      )
    }
    
    if (!detailer.is_active) {
      return NextResponse.json(
        { success: false, error: 'This booking page is currently unavailable.' },
        { status: 403 }
      )
    }

    // Get branding (optional - may not exist)
    const branding = await brandingService.getByDetailerId(detailerId)

    // Get services for this detailer (only active ones)
    // Use service role key to bypass RLS since this is a public endpoint
    const services = await serviceService.getByDetailerId(detailerId, true)

    // Get query parameters for booked slots
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let bookedSlots: { date: string, time: string }[] = []
    if (startDate && endDate) {
      try {
        bookedSlots = await appointmentService.getBookedSlots(
          detailerId,
          startDate,
          endDate
        )
      } catch (slotError) {
        // Log error but don't fail the entire request - booked slots are not critical
        console.error('Error fetching booked slots:', slotError)
      }
    }

    return NextResponse.json({
      success: true,
      detailer: {
        id: detailer.id,
        detailer_id: detailer.detailer_id,
        business_name: detailer.business_name,
        contact_name: detailer.contact_name,
        email: detailer.email,
        phone: detailer.phone
      },
      branding: branding || null,
      services: services || [],
      bookedSlots: bookedSlots || []
    })

  } catch (error) {
    console.error('Booking info API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

