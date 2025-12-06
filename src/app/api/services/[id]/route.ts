import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { serviceService } from '@/lib/database'
import { getSupabaseClient } from '@/lib/supabase'

// GET /api/services/[id] - Get service details
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

    // Get service
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      )
    }

    // Verify user owns this service's detailer
    // Resolve detailer UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(service.detailer_id)
    let detailerUuid = service.detailer_id

    if (!isUuid) {
      const { data: detailer } = await supabase
        .from('detailers')
        .select('id, detailer_id')
        .eq('detailer_id', service.detailer_id)
        .single()
      
      if (!detailer || detailer.detailer_id !== auth.detailerId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    } else {
      // Service uses UUID, need to check if it matches auth.userId
      if (service.detailer_id !== auth.userId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      service
    })

  } catch (error) {
    console.error('Get service error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/services/[id] - Update service
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

    // Get existing service to verify ownership
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingService) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingService.detailer_id)
    let detailerUuid = existingService.detailer_id

    if (!isUuid) {
      const { data: detailer } = await supabase
        .from('detailers')
        .select('id, detailer_id')
        .eq('detailer_id', existingService.detailer_id)
        .single()
      
      if (!detailer || detailer.detailer_id !== auth.detailerId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    } else {
      if (existingService.detailer_id !== auth.userId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { name, description, price, duration, category, is_active } = body

    // Build update object
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (price !== undefined) {
      if (isNaN(price) || price <= 0) {
        return NextResponse.json(
          { success: false, error: 'Price must be greater than 0' },
          { status: 400 }
        )
      }
      updates.price = price
    }
    if (duration !== undefined) {
      if (isNaN(duration) || duration <= 0) {
        return NextResponse.json(
          { success: false, error: 'Duration must be greater than 0' },
          { status: 400 }
        )
      }
      updates.duration = duration
    }
    if (category !== undefined) updates.category = category
    if (is_active !== undefined) updates.is_active = is_active

    // Update service
    const service = await serviceService.update(params.id, updates)

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Failed to update service' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      service
    })

  } catch (error) {
    console.error('Update service error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/services/[id] - Delete service
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

    // Get existing service to verify ownership
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingService) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingService.detailer_id)
    let detailerUuid = existingService.detailer_id

    if (!isUuid) {
      const { data: detailer } = await supabase
        .from('detailers')
        .select('id, detailer_id')
        .eq('detailer_id', existingService.detailer_id)
        .single()
      
      if (!detailer || detailer.detailer_id !== auth.detailerId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    } else {
      if (existingService.detailer_id !== auth.userId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    // Delete service
    const deleted = await serviceService.delete(params.id)

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete service' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

