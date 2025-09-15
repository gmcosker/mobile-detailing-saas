import { NextRequest, NextResponse } from 'next/server'
import { appointmentService } from '@/lib/database'
import { smsService } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Processing appointment reminders...')
    
    // Get appointments that need reminders (tomorrow's appointments)
    const appointments = await appointmentService.getUpcomingForReminders()
    
    if (appointments.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No appointments need reminders',
        sent: 0 
      })
    }

    let sentCount = 0
    const results = []

    for (const appointment of appointments) {
      try {
        const customer = (appointment as any).customers
        const detailer = (appointment as any).detailers
        
        if (!customer || !detailer) {
          console.warn('Missing customer or detailer data for appointment:', appointment.id)
          continue
        }

        const result = await smsService.sendAppointmentReminder(
          customer.phone,
          customer.name,
          appointment.service_type,
          appointment.scheduled_date,
          appointment.scheduled_time,
          detailer.business_name
        )

        if (result.success) {
          // Mark reminder as sent in database
          await appointmentService.updateStatus(appointment.id, appointment.status)
          sentCount++
          results.push({ appointmentId: appointment.id, success: true })
        } else {
          results.push({ 
            appointmentId: appointment.id, 
            success: false, 
            error: result.error 
          })
        }
      } catch (error) {
        console.error('Error sending reminder for appointment:', appointment.id, error)
        results.push({ 
          appointmentId: appointment.id, 
          success: false, 
          error: error.message 
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${appointments.length} appointments`,
      sent: sentCount,
      results
    })

  } catch (error) {
    console.error('Reminder processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}
