import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

// GET /api/debug/detailers - List all detailers (for debugging)
// This is a temporary debug endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data: detailers, error } = await supabase
      .from('detailers')
      .select('id, detailer_id, business_name, email, is_active')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching detailers:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch detailers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      detailers: detailers || [],
      count: detailers?.length || 0
    })

  } catch (error) {
    console.error('Debug detailers API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

