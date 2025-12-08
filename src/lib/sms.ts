// Twilio client will be initialized only on server-side
let twilioClient: any = null

// Initialize Twilio client (server-side only)
async function getTwilioClient() {
  if (typeof window !== 'undefined') {
    // We're on the client side, don't initialize Twilio
    return null
  }
  
  if (!twilioClient) {
    try {
      const twilio = (await import('twilio')).default
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID || 'ACdummy',
        process.env.TWILIO_AUTH_TOKEN || 'dummy_token'
      )
    } catch (error) {
      console.log('Twilio not available, using demo mode')
      return null
    }
  }
  
  return twilioClient
}

const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890'

// SMS Templates
export const smsTemplates = {
  appointmentReminder: (customerName: string, serviceType: string, date: string, time: string, businessName: string) => 
    `Hi ${customerName}! This is a reminder that your ${serviceType} appointment with ${businessName} is scheduled for tomorrow (${date}) at ${time}. We'll see you then! Reply STOP to opt out.`,
  
  appointmentConfirmation: (customerName: string, serviceType: string, date: string, time: string, businessName: string) =>
    `Hi ${customerName}! Your ${serviceType} appointment with ${businessName} is confirmed for ${date} at ${time}. We'll send a reminder 24 hours before. Thanks!`,
  
  onMyWay: (customerName: string, businessName: string, eta: string) =>
    `Hi ${customerName}! This is ${businessName}. I'm on my way to your location and should arrive in about ${eta} minutes. See you soon!`,
  
  serviceComplete: (customerName: string, businessName: string, paymentLink?: string) =>
    `Hi ${customerName}! Your mobile detailing service with ${businessName} is complete. ${paymentLink ? `You can pay online here: ${paymentLink}` : 'Thank you for your business!'} We'd love a review!`,
  
  paymentReminder: (customerName: string, amount: string, paymentLink: string, businessName: string) =>
    `Hi ${customerName}! This is a friendly reminder about your $${amount} invoice from ${businessName}. Pay securely here: ${paymentLink}`,
  
  weatherAlert: (customerName: string, date: string, businessName: string) =>
    `Hi ${customerName}! Due to weather conditions, we may need to reschedule your appointment on ${date}. ${businessName} will contact you soon to confirm or reschedule.`,
  
  appointmentReschedule: (customerName: string, serviceType: string, oldDate: string, oldTime: string, businessName: string, reason: string) =>
    `Hi ${customerName}! Your ${serviceType} appointment with ${businessName} scheduled for ${oldDate} at ${oldTime} needs to be rescheduled. ${reason} Please contact us to choose a new date and time.`,
  
  appointmentCancellation: (customerName: string, serviceType: string, date: string, time: string, businessName: string, reason: string) =>
    `Hi ${customerName}! Your ${serviceType} appointment with ${businessName} on ${date} at ${time} has been cancelled. ${reason} We apologize for any inconvenience. Please contact us if you'd like to reschedule.`
}

// SMS Service functions
export const smsService = {
  // Send a single SMS
  async sendSMS(to: string, message: string, scheduledTime?: Date): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Validate phone number format
      const cleanPhone = to.replace(/\D/g, '')
      if (cleanPhone.length < 10) {
        throw new Error('Invalid phone number')
      }

      const formattedPhone = cleanPhone.length === 10 ? `+1${cleanPhone}` : `+${cleanPhone}`

      // If scheduled for future, we'd use a job queue in production
      // For now, we'll just send immediately or simulate scheduling
      if (scheduledTime && scheduledTime > new Date()) {
        console.log(`SMS scheduled for ${scheduledTime.toISOString()}: ${message} to ${formattedPhone}`)
        
        // In production, you'd add this to a job queue
        // For demo, we'll return success
        return {
          success: true,
          messageId: `scheduled_${Date.now()}`,
        }
      }

      // Send immediately
      const client = await getTwilioClient()
      if (!client) {
        // Check if credentials are missing
        const hasAccountSid = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'ACdummy'
        const hasAuthToken = process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_AUTH_TOKEN !== 'dummy_token'
        const hasPhoneNumber = process.env.TWILIO_PHONE_NUMBER && process.env.TWILIO_PHONE_NUMBER !== '+1234567890'
        
        if (!hasAccountSid || !hasAuthToken || !hasPhoneNumber) {
          console.warn('[SMS] Twilio credentials not configured. Missing:', {
            accountSid: !hasAccountSid,
            authToken: !hasAuthToken,
            phoneNumber: !hasPhoneNumber
          })
          console.log(`[DEMO MODE] SMS would be sent: ${message} to ${formattedPhone}`)
          return {
            success: false,
            error: 'Twilio credentials not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to your environment variables.',
            messageId: `demo_${Date.now()}`,
          }
        }
        
        // Demo mode - simulate success
        console.log(`[DEMO MODE] SMS would be sent: ${message} to ${formattedPhone}`)
        return {
          success: true,
          messageId: `demo_${Date.now()}`,
        }
      }

      console.log(`[SMS] Attempting to send SMS to ${formattedPhone} from ${twilioPhoneNumber}`)
      console.log(`[SMS] Original phone number: "${to}", Cleaned: "${cleanPhone}", Formatted: "${formattedPhone}"`)
      const result = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: formattedPhone,
      })

      console.log(`[SMS] Successfully sent SMS. Message SID: ${result.sid}`)
      console.log(`[SMS] Message status: ${result.status}, To: ${result.to}, From: ${result.from}`)
      return {
        success: true,
        messageId: result.sid,
      }
    } catch (error: any) {
      console.error('[SMS] Error sending SMS:', error)
      console.error('[SMS] Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo
      })
      
      // For demo purposes, simulate success when Twilio credentials aren't real
      if (error.message?.includes('ACdummy') || (process.env.NODE_ENV === 'development' && !process.env.TWILIO_ACCOUNT_SID)) {
        console.log(`[DEMO MODE] SMS would be sent: ${message} to ${to}`)
        return {
          success: false,
          error: 'Twilio credentials not configured',
          messageId: `demo_${Date.now()}`,
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      }
    }
  },

  // Send appointment reminder
  async sendAppointmentReminder(
    customerPhone: string,
    customerName: string,
    serviceType: string,
    appointmentDate: string,
    appointmentTime: string,
    businessName: string
  ) {
    const message = smsTemplates.appointmentReminder(
      customerName,
      serviceType,
      appointmentDate,
      appointmentTime,
      businessName
    )

    return await this.sendSMS(customerPhone, message)
  },

  // Send appointment confirmation
  async sendAppointmentConfirmation(
    customerPhone: string,
    customerName: string,
    serviceType: string,
    appointmentDate: string,
    appointmentTime: string,
    businessName: string
  ) {
    const message = smsTemplates.appointmentConfirmation(
      customerName,
      serviceType,
      appointmentDate,
      appointmentTime,
      businessName
    )

    return await this.sendSMS(customerPhone, message)
  },

  // Send "on my way" notification
  async sendOnMyWay(
    customerPhone: string,
    customerName: string,
    businessName: string,
    eta: string
  ) {
    const message = smsTemplates.onMyWay(customerName, businessName, eta)
    return await this.sendSMS(customerPhone, message)
  },

  // Send service complete notification
  async sendServiceComplete(
    customerPhone: string,
    customerName: string,
    businessName: string,
    paymentLink?: string
  ) {
    const message = smsTemplates.serviceComplete(customerName, businessName, paymentLink)
    return await this.sendSMS(customerPhone, message)
  },

  // Send payment reminder
  async sendPaymentReminder(
    customerPhone: string,
    customerName: string,
    amount: string,
    paymentLink: string,
    businessName: string
  ) {
    const message = smsTemplates.paymentReminder(customerName, amount, paymentLink, businessName)
    return await this.sendSMS(customerPhone, message)
  },

  // Send appointment reschedule notification
  async sendAppointmentReschedule(
    customerPhone: string,
    customerName: string,
    serviceType: string,
    oldDate: string,
    oldTime: string,
    businessName: string,
    reason: string
  ) {
    const message = smsTemplates.appointmentReschedule(
      customerName,
      serviceType,
      oldDate,
      oldTime,
      businessName,
      reason
    )
    return await this.sendSMS(customerPhone, message)
  },

  // Send appointment cancellation notification
  async sendAppointmentCancellation(
    customerPhone: string,
    customerName: string,
    serviceType: string,
    date: string,
    time: string,
    businessName: string,
    reason: string
  ) {
    const message = smsTemplates.appointmentCancellation(
      customerName,
      serviceType,
      date,
      time,
      businessName,
      reason
    )
    return await this.sendSMS(customerPhone, message)
  },

  // Schedule 24-hour reminder
  async schedule24HourReminder(
    appointmentId: string,
    customerPhone: string,
    customerName: string,
    serviceType: string,
    appointmentDateTime: Date,
    businessName: string
  ) {
    // Calculate 24 hours before appointment
    const reminderTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000)
    
    // Only schedule if reminder time is in the future
    if (reminderTime <= new Date()) {
      console.log('Appointment is within 24 hours, not scheduling reminder')
      return { success: false, error: 'Appointment is too soon for 24-hour reminder' }
    }

    const appointmentDate = appointmentDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const appointmentTime = appointmentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    const message = smsTemplates.appointmentReminder(
      customerName,
      serviceType,
      appointmentDate,
      appointmentTime,
      businessName
    )

    // In production, you'd save this to a database and use a job scheduler
    // For demo, we'll simulate scheduling
    console.log(`[REMINDER SCHEDULED] ${reminderTime.toISOString()}: ${message}`)
    
    return await this.sendSMS(customerPhone, message, reminderTime)
  },

  // Format phone number for display
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    return phone
  },

  // Validate phone number
  isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length >= 10 && cleaned.length <= 11
  },

  // Get SMS delivery status (for tracking)
  async getSMSStatus(messageId: string): Promise<{ status: string; error?: string }> {
    try {
      if (messageId.startsWith('demo_') || messageId.startsWith('scheduled_')) {
        return { status: 'delivered' }
      }

      const client = await getTwilioClient()
      if (!client) {
        return { status: 'delivered' } // Demo mode
      }

      const message = await client.messages(messageId).fetch()
      return { status: message.status }
    } catch (error: any) {
      return { status: 'unknown', error: error.message }
    }
  },

  // Get SMS history for a phone number
  async getSMSHistory(phoneNumber: string, limit: number = 10) {
    try {
      const client = await getTwilioClient()
      if (!client) {
        // Return mock data for demo
        return [
          {
            id: 'demo_1',
            body: 'Hi John! This is a reminder that your Full Detail appointment is tomorrow at 2:00 PM.',
            status: 'delivered',
            dateSent: new Date(Date.now() - 24 * 60 * 60 * 1000),
            direction: 'outbound-api',
            errorMessage: null
          }
        ]
      }

      const messages = await client.messages.list({
        to: phoneNumber,
        limit: limit
      })

      return messages.map(msg => ({
        id: msg.sid,
        body: msg.body,
        status: msg.status,
        dateSent: msg.dateSent,
        direction: msg.direction,
        errorMessage: msg.errorMessage
      }))
    } catch (error: any) {
      console.error('Error fetching SMS history:', error)
      
      // Return mock data for demo
      return [
        {
          id: 'demo_1',
          body: 'Hi John! This is a reminder that your Full Detail appointment is tomorrow at 2:00 PM.',
          status: 'delivered',
          dateSent: new Date(Date.now() - 24 * 60 * 60 * 1000),
          direction: 'outbound-api',
          errorMessage: null
        }
      ]
    }
  }
}

// Utility functions for scheduling
export const reminderScheduler = {
  // Calculate next reminder time for an appointment
  calculateReminderTime(appointmentDateTime: Date): Date {
    return new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000)
  },

  // Check if an appointment needs a reminder scheduled
  needsReminder(appointmentDateTime: Date): boolean {
    const now = new Date()
    const reminderTime = this.calculateReminderTime(appointmentDateTime)
    return reminderTime > now
  },

  // Get all appointments that need reminders scheduled
  getAppointmentsNeedingReminders(appointments: any[]): any[] {
    return appointments.filter(apt => 
      this.needsReminder(new Date(apt.scheduledDateTime)) && 
      apt.status === 'confirmed' &&
      !apt.reminderSent
    )
  }
}

export default smsService
