'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import SMSManager from './SMSManager'
import { smsService, reminderScheduler } from '@/lib/sms'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Send,
  Users,
  Calendar,
  ArrowLeft,
  Bell,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'

// Mock data for appointments and SMS history
const mockAppointments = [
  {
    id: '1',
    customerName: 'Alice Brown',
    customerPhone: '(555) 111-2222',
    serviceType: 'Full Detail',
    scheduledDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    status: 'confirmed',
    reminderSent: false,
    amount: 150
  },
  {
    id: '2',
    customerName: 'Bob Green',
    customerPhone: '(555) 333-4444',
    serviceType: 'Wash & Wax',
    scheduledDateTime: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000), // 1.5 days from now
    status: 'confirmed',
    reminderSent: false,
    amount: 45
  },
  {
    id: '3',
    customerName: 'Carol White',
    customerPhone: '(555) 555-6666',
    serviceType: 'Interior Detail',
    scheduledDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    status: 'confirmed',
    reminderSent: true,
    amount: 75
  }
]

const mockSMSHistory = [
  {
    id: 'sms_1',
    customerName: 'Alice Brown',
    customerPhone: '(555) 111-2222',
    message: 'Hi Alice! This is a reminder that your Full Detail appointment is tomorrow at 2:00 PM.',
    type: 'reminder',
    status: 'delivered',
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 'sms_2',
    customerName: 'Bob Green',
    customerPhone: '(555) 333-4444',
    message: 'Hi Bob! Your Wash & Wax appointment is confirmed for tomorrow at 10:00 AM.',
    type: 'confirmation',
    status: 'delivered',
    sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    id: 'sms_3',
    customerName: 'Carol White',
    customerPhone: '(555) 555-6666',
    message: 'Hi Carol! This is Premium Auto Detailing. I\'m on my way and should arrive in about 15 minutes.',
    type: 'onmyway',
    status: 'delivered',
    sentAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  }
]

export default function SMSPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [smsHistory, setSMSHistory] = useState(mockSMSHistory)
  const [appointments, setAppointments] = useState(mockAppointments)

  // Calculate stats
  const totalSMSSent = smsHistory.length
  const deliveredSMS = smsHistory.filter(sms => sms.status === 'delivered').length
  const appointmentsNeedingReminders = reminderScheduler.getAppointmentsNeedingReminders(appointments).length
  const remindersScheduled = appointments.filter(apt => apt.reminderSent).length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
      case 'sent':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400'
      case 'failed':
        return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400'
    }
  }

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'reminder':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400'
      case 'confirmation':
        return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
      case 'onmyway':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400'
      case 'complete':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400'
      case 'payment':
        return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400'
    }
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const handleScheduleReminder = async (appointment: any) => {
    try {
      const result = await smsService.schedule24HourReminder(
        appointment.id,
        appointment.customerPhone,
        appointment.customerName,
        appointment.serviceType,
        appointment.scheduledDateTime,
        'Premium Auto Detailing'
      )

      if (result.success) {
        // Update appointment to mark reminder as sent
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointment.id 
              ? { ...apt, reminderSent: true }
              : apt
          )
        )
        alert('Reminder scheduled successfully!')
      } else {
        alert(result.error || 'Failed to schedule reminder')
      }
    } catch (error) {
      alert('Failed to schedule reminder')
    }
  }

  // Show SMS manager for selected customer
  if (selectedCustomer) {
    const appointment = appointments.find(apt => apt.id === selectedCustomer.id)
    
    return (
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCustomer(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Send SMS</h2>
              <p className="text-sm text-muted-foreground">
                Communicate with {selectedCustomer.customerName}
              </p>
            </div>
          </div>

          <SMSManager
            customerName={selectedCustomer.customerName}
            customerPhone={selectedCustomer.customerPhone}
            businessName="Premium Auto Detailing"
            appointmentDetails={appointment ? {
              serviceType: appointment.serviceType,
              date: appointment.scheduledDateTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              time: appointment.scheduledDateTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              amount: appointment.amount,
              paymentLink: `https://yourapp.com/pay/${appointment.id}`
            } : undefined}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">SMS & Reminders</h2>
        <p className="text-muted-foreground">
          Automate customer communication and reduce no-shows
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{totalSMSSent}</div>
              <div className="text-sm text-muted-foreground">SMS Sent</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 dark:bg-green-950 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{deliveredSMS}</div>
              <div className="text-sm text-muted-foreground">Delivered</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 dark:bg-orange-950 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{appointmentsNeedingReminders}</div>
              <div className="text-sm text-muted-foreground">Need Reminders</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded-lg">
              <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{remindersScheduled}</div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Upcoming Appointments */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Upcoming Appointments</h3>
          <p className="text-sm text-muted-foreground">
            Send reminders and notifications for scheduled appointments
          </p>
        </div>

        <div className="divide-y divide-border">
          {appointments.map((appointment) => {
            const needsReminder = reminderScheduler.needsReminder(appointment.scheduledDateTime)
            const appointmentDate = appointment.scheduledDateTime.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })

            return (
              <div key={appointment.id} className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-foreground">{appointment.customerName}</div>
                    {appointment.reminderSent && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 font-medium">
                        Reminder Sent
                      </span>
                    )}
                    {!needsReminder && !appointment.reminderSent && (
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-medium">
                        Too Soon
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {appointment.serviceType} • {appointmentDate}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {appointment.customerPhone}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {needsReminder && !appointment.reminderSent && (
                    <Button
                      onClick={() => handleScheduleReminder(appointment)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      Schedule Reminder
                    </Button>
                  )}
                  <Button
                    onClick={() => setSelectedCustomer(appointment)}
                    size="sm"
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send SMS
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SMS History */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent SMS Activity</h3>
          <p className="text-sm text-muted-foreground">
            Track your SMS communication history
          </p>
        </div>

        <div className="divide-y divide-border">
          {smsHistory.map((sms) => (
            <div key={sms.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-foreground">{sms.customerName}</div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getMessageTypeColor(sms.type)}`}>
                      {sms.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(sms.status)}`}>
                      {sms.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {sms.customerPhone} • {formatRelativeTime(sms.sentAt)}
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-sm text-foreground">
                  {sms.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SMS Tips */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-yellow-50 dark:bg-yellow-950 p-2 rounded-lg">
            <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">SMS Automation Tips</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Reduce No-Shows</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Send reminders 24 hours before appointments</li>
              <li>• Follow up with "On My Way" messages</li>
              <li>• Confirm appointments when booking</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Professional Communication</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Always include your business name</li>
              <li>• Keep messages clear and concise</li>
              <li>• Send payment links after service completion</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

