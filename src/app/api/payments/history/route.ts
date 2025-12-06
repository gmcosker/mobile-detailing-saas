import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { appointmentService } from '@/lib/database'
import { getSupabaseClient } from '@/lib/supabase'
import { isValidDate } from '@/lib/auth'

// GET /api/payments/history - Get payment history for detailer
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
    const detailerId = searchParams.get('detailerId') || auth.detailerId
    const limit = parseInt(searchParams.get('limit') || '50')
    const startDate = searchParams.get('startDate')

    // Verify user owns detailerId
    if (detailerId !== auth.detailerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Resolve detailer UUID
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(detailerId)
    let detailerUuid = detailerId

    if (!isUuid) {
      const { data: detailer } = await supabase
        .from('detailers')
        .select('id')
        .eq('detailer_id', detailerId)
        .single()
      
      if (!detailer) {
        return NextResponse.json(
          { success: false, error: 'Detailer not found' },
          { status: 404 }
        )
      }
      detailerUuid = detailer.id
    }

    // Query appointments with payment_status='paid'
    let query = supabase
      .from('appointments')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        service_type,
        total_amount,
        payment_status,
        stripe_payment_intent_id,
        created_at,
        customers (*)
      `)
      .eq('detailer_id', detailerUuid)
      .eq('payment_status', 'paid')

    // Apply date filter if provided
    if (startDate && isValidDate(startDate)) {
      query = query.gte('scheduled_date', startDate)
    }

    // Order by date (most recent first) and limit
    query = query
      .order('scheduled_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching payment history:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payment history' },
        { status: 500 }
      )
    }

    // Calculate total
    const total = data?.reduce((sum, apt) => sum + (apt.total_amount || 0), 0) || 0

    return NextResponse.json({
      success: true,
      payments: data || [],
      total
    })

  } catch (error) {
    console.error('Payment history error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

