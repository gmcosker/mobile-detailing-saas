import { NextRequest, NextResponse } from 'next/server'
import { appointmentService } from '@/lib/database'

// GET /api/payments/info/[appointmentId] - Get appointment info for payment page (PUBLIC)
// This is a public endpoint for customers to view payment information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise that needs to be awaited
    const { appointmentId } = await params
    
    // Get appointment with customer and detailer info
    const appointment = await appointmentService.getById(appointmentId)
    
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Return only the data needed for payment (no sensitive info)
    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        scheduled_date: appointment.scheduled_date,
        scheduled_time: appointment.scheduled_time,
        service_type: appointment.service_type,
        total_amount: appointment.total_amount,
        payment_status: appointment.payment_status,
        customers: appointment.customers ? {
          name: appointment.customers.name,
          email: appointment.customers.email
        } : null,
        detailers: appointment.detailers ? {
          business_name: appointment.detailers.business_name,
          phone: appointment.detailers.phone
        } : null
      }
    })

  } catch (error) {
    console.error('Payment info API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

