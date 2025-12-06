import { NextRequest, NextResponse } from 'next/server'
import { detailerService, appointmentService } from '@/lib/database'
import { isValidDate } from '@/lib/auth'

// GET /api/booking/[detailerId]/availability - Get available time slots for detailer
// This is a PUBLIC endpoint (no auth required)
export async function GET(
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Default to next 7 days if not provided
    const today = new Date()
    const defaultStartDate = today.toISOString().split('T')[0]
    const defaultEndDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const queryStartDate = startDate && isValidDate(startDate) ? startDate : defaultStartDate
    const queryEndDate = endDate && isValidDate(endDate) ? endDate : defaultEndDate

    // Get booked slots
    const bookedSlots = await appointmentService.getBookedSlots(
      params.detailerId,
      queryStartDate,
      queryEndDate
    )

    // Generate available time slots
    // Business hours: 8 AM to 6 PM, 1-hour slots
    const businessHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    
    // Generate date range
    const start = new Date(queryStartDate)
    const end = new Date(queryEndDate)
    const availableSlots: { date: string, times: string[] }[] = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      
      // Filter out booked times for this date
      const bookedTimesForDate = bookedSlots
        .filter(slot => slot.date === dateStr)
        .map(slot => slot.time.substring(0, 5)) // Extract HH:MM from HH:MM:SS

      const availableTimes = businessHours.filter(time => !bookedTimesForDate.includes(time))
      
      availableSlots.push({
        date: dateStr,
        times: availableTimes
      })
    }

    return NextResponse.json({
      success: true,
      availableSlots,
      bookedSlots: bookedSlots.map(slot => ({
        date: slot.date,
        time: slot.time.substring(0, 5) // Return HH:MM format
      }))
    })

  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

