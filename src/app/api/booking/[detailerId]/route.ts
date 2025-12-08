import { NextRequest, NextResponse } from 'next/server'
import { detailerService, customerService, appointmentService, serviceService } from '@/lib/database'
import { isValidEmail, isValidPhone, isValidDate, isValidTime } from '@/lib/auth'

// POST /api/booking/[detailerId] - Create booking from public booking page
// This is a PUBLIC endpoint (no auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: { detailerId: string } }
) {
  try {
    // Verify detailer exists and is active
    const detailer = await detailerService.getByDetailerId(params.detailerId)
    
    if (!detailer || !detailer.is_active) {
      return NextResponse.json(
        { success: false, error: 'Detailer not found or inactive' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      serviceId,
      serviceName, // Optional: service name (for default services)
      servicePrice, // Optional: service price (for default services)
      scheduled_date,
      scheduled_time,
      customer
    } = body

    // Validation
    if (!serviceId || !scheduled_date || !scheduled_time || !customer) {
      return NextResponse.json(
        { success: false, error: 'serviceId, scheduled_date, scheduled_time, and customer are required' },
        { status: 400 }
      )
    }

    if (!customer.name || !customer.phone) {
      return NextResponse.json(
        { success: false, error: 'Customer name and phone are required' },
        { status: 400 }
      )
    }

    // Validate date format
    if (!isValidDate(scheduled_date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Validate date and time is in future
    // Parse the scheduled date (YYYY-MM-DD) and time (HH:MM:SS or HH:MM)
    const [year, month, day] = scheduled_date.split('-').map(Number)
    const [hours, minutes] = scheduled_time.split(':').map(Number)
    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes || 0, 0)
    
    // Get current date and time
    const now = new Date()
    
    // Check if appointment is in the past (allows same-day if time is later)
    if (appointmentDateTime <= now) {
      return NextResponse.json(
        { success: false, error: 'Appointment date and time must be in the future' },
        { status: 400 }
      )
    }

    // Validate time format
    if (!isValidTime(scheduled_time)) {
      return NextResponse.json(
        { success: false, error: 'Invalid time format (use HH:MM:SS or HH:MM)' },
        { status: 400 }
      )
    }

    // Validate customer data
    if (customer.email && !isValidEmail(customer.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (!isValidPhone(customer.phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Verify service exists and belongs to detailer
    let selectedService: any = null
    
    // Try to find service in database first
    const services = await serviceService.getByDetailerId(params.detailerId)
    selectedService = services.find(s => s.id === serviceId || s.id.toString() === serviceId.toString())
    
    // If service not found in database, use serviceName and servicePrice from request (default services)
    if (!selectedService) {
      if (serviceName && servicePrice !== undefined) {
        selectedService = {
          id: serviceId,
          name: serviceName,
          price: servicePrice,
          is_active: true
        }
      } else {
        return NextResponse.json(
          { success: false, error: 'Service not found. Please provide service name and price.' },
          { status: 404 }
        )
      }
    }
    
    // Verify service is active (if from database)
    if (selectedService.is_active === false) {
      return NextResponse.json(
        { success: false, error: 'Service is inactive' },
        { status: 400 }
      )
    }

    // Verify time slot is available
    const bookedSlots = await appointmentService.getBookedSlots(
      params.detailerId,
      scheduled_date,
      scheduled_date
    )

    const timeSlot = scheduled_time.substring(0, 5) // Extract HH:MM
    const isBooked = bookedSlots.some(
      slot => slot.date === scheduled_date && slot.time.substring(0, 5) === timeSlot
    )

    if (isBooked) {
      return NextResponse.json(
        { success: false, error: 'Time slot is already booked' },
        { status: 400 }
      )
    }

    // Find or create customer
    // Match on phone AND email together if both provided, otherwise match on phone OR email
    const { getSupabaseClient } = await import('@/lib/supabase')
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    let customerRecord: any = null

    if (customer.email) {
      // If both phone and email provided, match on BOTH together
      const { data: matchedCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', customer.phone)
        .eq('email', customer.email)
        .maybeSingle()
      
      customerRecord = matchedCustomer
    } else {
      // If only phone provided, match on phone only
      const { data: matchedCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', customer.phone)
        .maybeSingle()
      
      customerRecord = matchedCustomer
    }

    if (!customerRecord) {
      // No match found - create new customer
      customerRecord = await customerService.create({
        name: customer.name,
        email: customer.email || null,
        phone: customer.phone,
        address: customer.address || null,
        notes: customer.notes || null
      })

      if (!customerRecord) {
        return NextResponse.json(
          { success: false, error: 'Failed to create customer' },
          { status: 500 }
        )
      }
    } else {
      // Customer found - check if name matches
      const nameMatches = customerRecord.name.toLowerCase().trim() === customer.name.toLowerCase().trim()
      
      if (!nameMatches) {
        // Name doesn't match - create new customer record instead of updating
        customerRecord = await customerService.create({
          name: customer.name,
          email: customer.email || null,
          phone: customer.phone,
          address: customer.address || null,
          notes: customer.notes || null
        })

        if (!customerRecord) {
          return NextResponse.json(
            { success: false, error: 'Failed to create customer' },
            { status: 500 }
          )
        }
      } else {
        // Name matches - update only email, address, and notes (never update name)
        const updates: any = {}
        if (customer.email && customer.email !== customerRecord.email) updates.email = customer.email
        if (customer.address && customer.address !== customerRecord.address) updates.address = customer.address
        if (customer.notes && customer.notes !== customerRecord.notes) updates.notes = customer.notes

        if (Object.keys(updates).length > 0) {
          customerRecord = await customerService.update(customerRecord.id, updates)
        }
      }
    }

    // Resolve detailer UUID (supabase already initialized above)

    const { data: detailerData, error: detailerError } = await supabase
      .from('detailers')
      .select('id')
      .eq('detailer_id', params.detailerId)
      .single()

    if (detailerError || !detailerData) {
      return NextResponse.json(
        { success: false, error: 'Detailer not found' },
        { status: 404 }
      )
    }

    const detailerId = (detailerData as { id: string }).id

    // Create appointment
    const appointment = await appointmentService.create({
      detailer_id: detailerId,
      customer_id: customerRecord.id,
      scheduled_date,
      scheduled_time,
      service_type: selectedService.name,
      total_amount: selectedService.price,
      status: 'pending',
      payment_status: 'pending'
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
    console.error('Booking API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

