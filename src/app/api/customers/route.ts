import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { customerService } from '@/lib/database'

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

    // Get customers - use getAll for now since customers aren't directly linked to detailers
    // In production, you might want to add a detailer_id to customers table
    // For MVP, we'll get all customers (they'll be filtered by appointments when needed)
    let customers = await customerService.getAll(limit)
    
    // If search is provided, filter customers
    if (search) {
      const searchLower = search.toLowerCase()
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone.includes(search)
      )
    }

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

