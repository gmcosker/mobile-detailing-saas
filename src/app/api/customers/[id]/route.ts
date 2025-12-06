import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { customerService, appointmentService } from '@/lib/database'
import { isValidEmail, isValidPhone } from '@/lib/auth'

// GET /api/customers/[id] - Get customer details
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

    const customer = await customerService.getById(params.id)

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Verify customer belongs to detailer's appointments
    const appointments = await appointmentService.getByDetailer(auth.detailerId, 100)
    const hasAccess = appointments.some(apt => apt.customer_id === params.id)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      customer
    })

  } catch (error) {
    console.error('Get customer error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/customers/[id] - Update customer info
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

    // Get existing customer to verify access
    const existingCustomer = await customerService.getById(params.id)

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Verify customer belongs to detailer's appointments
    const appointments = await appointmentService.getByDetailer(auth.detailerId, 100)
    const hasAccess = appointments.some(apt => apt.customer_id === params.id)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, phone, address, notes } = body

    // Build update object
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (email !== undefined) {
      if (email && !isValidEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
      updates.email = email || null
    }
    if (phone !== undefined) {
      if (!isValidPhone(phone)) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number format' },
          { status: 400 }
        )
      }
      updates.phone = phone
    }
    if (address !== undefined) updates.address = address || null
    if (notes !== undefined) updates.notes = notes || null

    // Update customer
    const customer = await customerService.update(params.id, updates)

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Failed to update customer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      customer
    })

  } catch (error) {
    console.error('Update customer error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

