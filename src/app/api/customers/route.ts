import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { customerService, appointmentService } from '@/lib/database'

// GET /api/customers - List customers for a detailer
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
    const search = searchParams.get('search') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    // Verify user owns detailerId
    if (detailerId !== auth.detailerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get customers filtered by detailer through appointments
    // This ensures each detailer only sees their own customers
    const customers = await customerService.getByDetailer(auth.detailerId, search, limit)

    return NextResponse.json({
      success: true,
      customers,
      count: customers.length
    })

  } catch (error) {
    console.error('Customers API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create new customer
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
    const { name, email, phone, address, notes } = body

    // Validation
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Email format validation if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Phone number format validation
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Create customer
    const customer = await customerService.create({
      name,
      email: email || null,
      phone,
      address: address || null,
      notes: notes || null
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Failed to create customer' },
        { status: 500 }
      )
    }

    // Link customer to detailer by creating a placeholder appointment
    // This ensures the customer appears in the detailer's customer list
    // The appointment is set far in the future and won't show in normal schedules
    const farFutureDate = new Date()
    farFutureDate.setFullYear(farFutureDate.getFullYear() + 10) // 10 years in the future
    const placeholderDate = farFutureDate.toISOString().split('T')[0] // YYYY-MM-DD format

    // Resolve detailer UUID from detailerId
    const { getSupabaseClient } = await import('@/lib/supabase')
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Get detailer UUID
    const { data: detailerData } = await supabase
      .from('detailers')
      .select('id')
      .eq('detailer_id', auth.detailerId)
      .single()

    if (!detailerData) {
      return NextResponse.json(
        { success: false, error: 'Detailer not found' },
        { status: 404 }
      )
    }

    // Create placeholder appointment to link customer to detailer
    const placeholderAppointment = await appointmentService.create({
      detailer_id: detailerData.id,
      customer_id: customer.id,
      scheduled_date: placeholderDate,
      scheduled_time: '00:00:00',
      service_type: 'Customer Added Manually',
      status: 'pending',
      notes: 'Placeholder appointment - Customer added manually by detailer',
      total_amount: null,
      payment_status: null
    })

    // Even if placeholder appointment creation fails, return the customer
    // The customer was created successfully, and they can be linked later via a real appointment
    if (!placeholderAppointment) {
      console.warn('Failed to create placeholder appointment for customer:', customer.id)
    }

    return NextResponse.json({
      success: true,
      customer
    }, { status: 201 })

  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

