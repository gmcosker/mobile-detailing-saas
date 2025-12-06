import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { serviceService } from '@/lib/database'

// GET /api/services - List services for detailer
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
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Verify user owns detailerId
    if (detailerId !== auth.detailerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get services
    const services = activeOnly
      ? await serviceService.getByDetailerId(detailerId)
      : await serviceService.getAllByDetailerId(detailerId)

    return NextResponse.json({
      success: true,
      services
    })

  } catch (error) {
    console.error('Services API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/services - Create new service
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
      name,
      description,
      price,
      duration,
      category,
      is_active
    } = body

    // Validation
    if (!detailer_id || !name || price === undefined || duration === undefined) {
      return NextResponse.json(
        { success: false, error: 'detailer_id, name, price, and duration are required' },
        { status: 400 }
      )
    }

    // Verify user owns detailer_id
    if (detailer_id !== auth.detailerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Validate price > 0
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate duration > 0
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json(
        { success: false, error: 'Duration must be greater than 0' },
        { status: 400 }
      )
    }

    // Create service
    const service = await serviceService.create(detailer_id, {
      name,
      description: description || null,
      price,
      duration,
      category: category || null,
      is_active: is_active !== undefined ? is_active : true
    })

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Failed to create service' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      service
    }, { status: 201 })

  } catch (error) {
    console.error('Create service error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

