import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, verifyResourceOwnership } from '@/lib/auth'
import { appointmentService } from '@/lib/database'
import { getSupabaseClient } from '@/lib/supabase'
import { isValidDate } from '@/lib/auth'

// GET /api/appointments - List appointments with filters
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const detailerId = searchParams.get('detailerId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Verify user owns detailerId or is admin
    if (detailerId && detailerId !== auth.detailerId) {
      // Check if user has access to this detailer
      const supabase = getSupabaseClient()
      if (!supabase) {
        return NextResponse.json(
          { success: false, error: 'Database connection failed' },
          { status: 500 }
        )
      }

      // Resolve detailer UUID if needed
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(detailerId)
      let detailerUuid = detailerId

      if (!isUuid) {
        const { data: detailer } = await supabase
          .from('detailers')
          .select('id')
          .eq('detailer_id', detailerId)
          .single()
        
        if (!detailer || detailer.id !== auth.userId) {
          return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
          )
        }
        detailerUuid = detailer.id
      } else {
        if (detailerUuid !== auth.userId) {
          return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
          )
        }
      }
    }

    // Get appointments
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Resolve detailer UUID
    const targetDetailerId = detailerId || auth.detailerId
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetDetailerId)
    let detailerUuid = targetDetailerId

    if (!isUuid) {
      const { data: detailer } = await supabase
        .from('detailers')
        .select('id')
        .eq('detailer_id', targetDetailerId)
        .single()
      
      if (!detailer) {
        return NextResponse.json(
          { success: false, error: 'Detailer not found' },
          { status: 404 }
        )
      }
      detailerUuid = detailer.id
    }

    // Build query
    let query = supabase
      .from('appointments')
      .select(`
        *,
        customers (*)
      `)
      .eq('detailer_id', detailerUuid)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (startDate && isValidDate(startDate)) {
      query = query.gte('scheduled_date', startDate)
    }

    if (endDate && isValidDate(endDate)) {
      query = query.lte('scheduled_date', endDate)
    }

    // Order and limit
    query = query
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch appointments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointments: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Appointments API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/appointments - Create new appointment
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

    const body = await request.json()
    const {
      detailer_id,
      customer_id,
      scheduled_date,
      scheduled_time,
      service_type,
      total_amount,
      notes
    } = body

    // Validation
    if (!detailer_id || !customer_id || !scheduled_date || !scheduled_time || !service_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user owns detailer_id
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Resolve detailer UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(detailer_id)
    let detailerUuid = detailer_id

    if (!isUuid) {
      const { data: detailer } = await supabase
        .from('detailers')
        .select('id')
        .eq('detailer_id', detailer_id)
        .single()
      
      if (!detailer || detailer.id !== auth.userId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
      detailerUuid = detailer.id
    } else {
      if (detailerUuid !== auth.userId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    // Validate date is in future
    const appointmentDate = new Date(scheduled_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (appointmentDate < today) {
      return NextResponse.json(
        { success: false, error: 'Appointment date must be in the future' },
        { status: 400 }
      )
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
    if (!timeRegex.test(scheduled_time)) {
      return NextResponse.json(
        { success: false, error: 'Invalid time format (use HH:MM:SS or HH:MM)' },
        { status: 400 }
      )
    }

    // Validate amount if provided
    if (total_amount !== undefined && (isNaN(total_amount) || total_amount < 0)) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Create appointment
    const appointment = await appointmentService.create({
      detailer_id: detailerUuid,
      customer_id,
      scheduled_date,
      scheduled_time,
      service_type,
      total_amount: total_amount || null,
      notes: notes || null,
      status: 'pending'
    })

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Failed to create appointment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointment
    }, { status: 201 })

  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

