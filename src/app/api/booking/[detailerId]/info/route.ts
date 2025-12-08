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
    console.log('Looking for detailer with detailer_id:', detailerId)
    
    // Verify detailer exists and is active
    const detailer = await detailerService.getByDetailerId(detailerId)
    
    if (!detailer) {
      console.error('Detailer not found for detailer_id:', detailerId)
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
        { success: false, error: `Detailer not found. Searched for detailer_id: "${detailerId}"` },
        { status: 404 }
      )
    }
    
    if (!detailer.is_active) {
      console.error('Detailer found but inactive:', detailerId)
      return NextResponse.json(
        { success: false, error: 'Detailer account is inactive' },
        { status: 403 }
      )
    }

    // Get branding (optional - may not exist)
    const branding = await brandingService.getByDetailerId(detailerId)

    // Get services for this detailer (only active ones)
    // Use service role key to bypass RLS since this is a public endpoint
    console.log('=== BOOKING INFO DEBUG ===')
    console.log('Fetching services for detailer_id:', detailerId)
    console.log('Detailer found:', detailer.id, detailer.detailer_id)
    
    const services = await serviceService.getByDetailerId(detailerId, true)
    console.log('Found services:', services?.length || 0, services)
    
    // Additional debug: Check if services exist in database
    if (services.length === 0) {
      const supabase = (await import('@/lib/supabase')).getSupabaseClient()
      if (supabase) {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceRoleKey) {
          const { createClient } = await import('@supabase/supabase-js')
          const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
          
          // Check all services for this detailer (including inactive)
          const { data: allServices, error: allError } = await adminSupabase
            .from('services')
            .select('*')
            .eq('detailer_id', detailer.id)
          
          console.log('All services (including inactive) for detailer UUID:', detailer.id, ':', allServices?.length || 0)
          if (allServices && allServices.length > 0) {
            console.log('Services found:', allServices.map(s => ({ 
              id: s.id, 
              name: s.name, 
              is_active: s.is_active,
              detailer_id: s.detailer_id 
            })))
          }
        }
      }
    }
    console.log('=== END BOOKING INFO DEBUG ===')

    // Get query parameters for booked slots
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let bookedSlots: { date: string, time: string }[] = []
    if (startDate && endDate) {
      bookedSlots = await appointmentService.getBookedSlots(
        detailerId,
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

