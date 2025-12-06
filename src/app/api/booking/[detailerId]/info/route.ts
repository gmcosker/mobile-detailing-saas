import { NextRequest, NextResponse } from 'next/server'
import { detailerService, brandingService, serviceService, appointmentService } from '@/lib/database'

// GET /api/booking/[detailerId]/info - Get detailer info, branding, and services for public booking page
// This is a PUBLIC endpoint (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { detailerId: string } }
) {
  try {
    console.log('Looking for detailer with detailer_id:', params.detailerId)
    
    // Verify detailer exists and is active
    const detailer = await detailerService.getByDetailerId(params.detailerId)
    
    if (!detailer) {
      console.error('Detailer not found for detailer_id:', params.detailerId)
      // Try to find any detailers to help debug
      const supabase = (await import('@/lib/supabase')).getSupabaseClient()
      if (supabase) {
        const { data: allDetailers } = await supabase
          .from('detailers')
          .select('detailer_id, business_name, is_active')
          .limit(10)
        console.log('Available detailers:', allDetailers)
      }
      return NextResponse.json(
        { success: false, error: `Detailer not found. Searched for detailer_id: "${params.detailerId}"` },
        { status: 404 }
      )
    }
    
    if (!detailer.is_active) {
      console.error('Detailer found but inactive:', params.detailerId)
      return NextResponse.json(
        { success: false, error: 'Detailer account is inactive' },
        { status: 403 }
      )
    }

    // Get branding (optional - may not exist)
    const branding = await brandingService.getByDetailerId(params.detailerId)

    // Get services for this detailer (only active ones)
    console.log('Fetching services for detailer_id:', params.detailerId)
    const services = await serviceService.getByDetailerId(params.detailerId)
    console.log('Found services:', services?.length || 0, services)

    // Get query parameters for booked slots
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let bookedSlots: { date: string, time: string }[] = []
    if (startDate && endDate) {
      bookedSlots = await appointmentService.getBookedSlots(
        params.detailerId,
        startDate,
        endDate
      )
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
      bookedSlots
    })

  } catch (error) {
    console.error('Booking info API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

