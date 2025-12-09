'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Calendar,
  Plus,
  Clock,
  Car,
  User,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  X
} from 'lucide-react'

interface Appointment {
  id: string
  scheduled_date: string
  scheduled_time: string
  service_type: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  total_amount: number | null
  notes: string | null
  customers: {
    name: string
    phone: string
    email: string | null
    address: string | null
  }
}

export default function SchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [rescheduleModal, setRescheduleModal] = useState<{ open: boolean; appointment: Appointment | null }>({ open: false, appointment: null })
  const [cancelModal, setCancelModal] = useState<{ open: boolean; appointment: Appointment | null }>({ open: false, appointment: null })
  const [viewDetailsModal, setViewDetailsModal] = useState<{ open: boolean; appointment: Appointment | null }>({ open: false, appointment: null })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Not authenticated. Please log in.')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/appointments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch appointments')
      }

      setAppointments(data.appointments || [])
    } catch (err: any) {
      console.error('Error fetching appointments:', err)
      setError(err.message || 'Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (time: string): string => {
    // Convert HH:MM:SS to 12-hour format
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const handleConfirm = async (appointmentId: string) => {
    setConfirmingId(appointmentId)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Not authenticated. Please log in again.')
        return
      }

      const response = await fetch(`/api/appointments/${appointmentId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to confirm appointment')
      }

      // Refresh appointments list
      await fetchAppointments()

      // Show success message
      const notifications = data.notifications || {}
      let message = 'Appointment confirmed!'
      if (notifications.sms?.sent) {
        message += ' SMS sent to customer.'
      } else if (notifications.sms?.error) {
        message += ` (SMS failed: ${notifications.sms.error})`
      }
      if (notifications.email?.sent) {
        message += ' Email sent to customer.'
      }
      
      alert(message)
    } catch (err: any) {
      console.error('Error confirming appointment:', err)
      alert(err.message || 'Failed to confirm appointment. Please try again.')
    } finally {
      setConfirmingId(null)
    }
  }

  const handleReschedule = (appointment: Appointment) => {
    setRescheduleModal({ open: true, appointment })
  }

  const handleCancel = (appointment: Appointment) => {
    setCancelModal({ open: true, appointment })
  }

  const handleSendReminder = async (appointmentId: string) => {
    setActionLoading(`reminder-${appointmentId}`)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Not authenticated. Please log in again.')
        return
      }

      const response = await fetch(`/api/appointments/${appointmentId}/reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send reminder')
      }

      const notification = data.notification || {}
      let message = 'Reminder sent!'
      if (notification.sms?.sent) {
        message += ' SMS sent to customer.'
      } else if (notification.sms?.error) {
        message += ` (SMS failed: ${notification.sms.error})`
      }
      
      alert(message)
    } catch (err: any) {
      console.error('Error sending reminder:', err)
      alert(err.message || 'Failed to send reminder. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (appointment: Appointment) => {
    setViewDetailsModal({ open: true, appointment })
  }

  const submitReschedule = async (reason: string) => {
    if (!rescheduleModal.appointment) return
    
    setActionLoading(`reschedule-${rescheduleModal.appointment.id}`)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Not authenticated. Please log in again.')
        return
      }

      const response = await fetch(`/api/appointments/${rescheduleModal.appointment.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to reschedule appointment')
      }

      const notification = data.notification || {}
      let message = 'Customer notified of reschedule request!'
      if (notification.sms?.sent) {
        message += ' SMS sent to customer.'
      } else if (notification.sms?.error) {
        message += ` (SMS failed: ${notification.sms.error})`
      }
      
      alert(message)
      setRescheduleModal({ open: false, appointment: null })
      await fetchAppointments()
    } catch (err: any) {
      console.error('Error rescheduling appointment:', err)
      alert(err.message || 'Failed to reschedule appointment. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const submitCancel = async (reason: string) => {
    if (!cancelModal.appointment) return
    
    setActionLoading(`cancel-${cancelModal.appointment.id}`)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Not authenticated. Please log in again.')
        return
      }

      const response = await fetch(`/api/appointments/${cancelModal.appointment.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel appointment')
      }

      const notification = data.notification || {}
      let message = 'Appointment cancelled!'
      if (notification.sms?.sent) {
        message += ' SMS sent to customer.'
      } else if (notification.sms?.error) {
        message += ` (SMS failed: ${notification.sms.error})`
      }
      
      alert(message)
      setCancelModal({ open: false, appointment: null })
      await fetchAppointments()
    } catch (err: any) {
      console.error('Error cancelling appointment:', err)
      alert(err.message || 'Failed to cancel appointment. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleClear = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this cancelled appointment? This action cannot be undone.')) {
      return
    }

    setActionLoading(`clear-${appointmentId}`)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Not authenticated. Please log in again.')
        return
      }

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete appointment')
      }

      // Optimistically remove from state immediately
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId))
      
      // Then refresh to ensure consistency
      await fetchAppointments()
    } catch (err: any) {
      console.error('Error deleting appointment:', err)
      // Refresh on error to restore correct state
      await fetchAppointments()
      alert(err.message || 'Failed to delete appointment. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getToday = (): string => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getTomorrow = (): string => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const year = tomorrow.getFullYear()
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const day = String(tomorrow.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Normalize appointment dates to YYYY-MM-DD format for comparison
  // This function extracts the date part without any timezone conversion
  const normalizeDate = (dateStr: string): string => {
    // If date is already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    // If it includes time or timezone info, extract just the date part (before T or space)
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }
    if (dateStr.includes(' ')) {
      return dateStr.split(' ')[0]
    }
    // If it's a date string that might have timezone issues, parse it carefully
    // Extract YYYY-MM-DD pattern directly from the string
    const dateMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      return dateMatch[0] // Return the matched YYYY-MM-DD string
    }
    // Last resort: try parsing, but use the date components directly from the string
    // to avoid timezone conversion
    const parts = dateStr.split(/[-/]/)
    if (parts.length >= 3) {
      const year = parts[0].padStart(4, '0')
      const month = parts[1].padStart(2, '0')
      const day = parts[2].padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    // Fallback: return as-is if we can't parse it
    return dateStr
  }

  const today = getToday()
  const tomorrow = getTomorrow()
  
  const todayAppointments = appointments.filter(apt => {
    const aptDate = normalizeDate(apt.scheduled_date)
    return aptDate === today
  })
  
  const tomorrowAppointments = appointments.filter(apt => {
    const aptDate = normalizeDate(apt.scheduled_date)
    return aptDate === tomorrow
  })
  
  // Get date 7 days from today for "This Week" section
  const getWeekFromNow = (): string => {
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    const year = weekFromNow.getFullYear()
    const month = String(weekFromNow.getMonth() + 1).padStart(2, '0')
    const day = String(weekFromNow.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const weekFromNow = getWeekFromNow()
  
  // This Week's Appointments (after tomorrow, within 7 days)
  const thisWeekAppointments = appointments.filter(apt => {
    const aptDate = normalizeDate(apt.scheduled_date)
    return aptDate > tomorrow && aptDate <= weekFromNow
  })
  
  // Upcoming Appointments (beyond this week)
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = normalizeDate(apt.scheduled_date)
    return aptDate > weekFromNow
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <Button onClick={fetchAppointments} className="mt-2" size="sm">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground">Manage your appointments and availability</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Calendar View Toggle */}
      <div className="flex gap-2">
        <Button 
          variant={viewMode === 'calendar' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setViewMode('calendar')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Calendar View
        </Button>
        <Button 
          variant={viewMode === 'list' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <Clock className="h-4 w-4 mr-2" />
          List View
        </Button>
      </div>

      {/* Conditional Rendering based on view mode */}
      {viewMode === 'calendar' ? (
        <CalendarView 
          appointments={appointments}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          formatTime={formatTime}
          onConfirm={handleConfirm}
          confirmingId={confirmingId}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
          onSendReminder={handleSendReminder}
          onViewDetails={handleViewDetails}
          onClear={handleClear}
          actionLoading={actionLoading}
        />
      ) : (
        <>
          {/* Today's Appointments */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Today's Appointments</h2>
        {todayAppointments.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayAppointments.map((appointment) => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment} 
                formatTime={formatTime}
                onConfirm={handleConfirm}
                isConfirming={confirmingId === appointment.id}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
                onSendReminder={handleSendReminder}
                onViewDetails={handleViewDetails}
                onClear={handleClear}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tomorrow's Appointments */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Tomorrow's Appointments</h2>
        {tomorrowAppointments.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No appointments scheduled for tomorrow</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tomorrowAppointments.map((appointment) => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment} 
                formatTime={formatTime}
                onConfirm={handleConfirm}
                isConfirming={confirmingId === appointment.id}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
                onSendReminder={handleSendReminder}
                onViewDetails={handleViewDetails}
                onClear={handleClear}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* This Week's Appointments */}
      {thisWeekAppointments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">This Week's Appointments</h2>
          <div className="space-y-4">
            {thisWeekAppointments.map((appointment) => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment} 
                formatTime={formatTime}
                onConfirm={handleConfirm}
                isConfirming={confirmingId === appointment.id}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
                onSendReminder={handleSendReminder}
                onViewDetails={handleViewDetails}
                onClear={handleClear}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Appointments</h2>
          <div className="space-y-4">
            {upcomingAppointments.slice(0, 10).map((appointment) => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment} 
                formatTime={formatTime}
                onConfirm={handleConfirm}
                isConfirming={confirmingId === appointment.id}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
                onSendReminder={handleSendReminder}
                onViewDetails={handleViewDetails}
                onClear={handleClear}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {rescheduleModal.open && rescheduleModal.appointment && (
        <RescheduleModal
          appointment={rescheduleModal.appointment}
          formatTime={formatTime}
          onClose={() => setRescheduleModal({ open: false, appointment: null })}
          onSubmit={submitReschedule}
          isLoading={!!actionLoading && actionLoading.startsWith('reschedule-')}
        />
      )}

      {cancelModal.open && cancelModal.appointment && (
        <CancelModal
          appointment={cancelModal.appointment}
          formatTime={formatTime}
          onClose={() => setCancelModal({ open: false, appointment: null })}
          onSubmit={submitCancel}
          isLoading={!!actionLoading && actionLoading.startsWith('cancel-')}
        />
      )}

      {viewDetailsModal.open && viewDetailsModal.appointment && (
        <ViewDetailsModal
          appointment={viewDetailsModal.appointment}
          formatTime={formatTime}
          onClose={() => setViewDetailsModal({ open: false, appointment: null })}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Today"
          value={todayAppointments.length.toString()}
          subtitle="appointments"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="This Week"
          value={appointments.filter(apt => {
            // Normalize appointment date to YYYY-MM-DD for comparison
            const aptDateStr = normalizeDate(apt.scheduled_date)
            const todayStr = getToday()
            const tomorrow = getTomorrow()
            const weekFromNow = new Date()
            weekFromNow.setDate(weekFromNow.getDate() + 7)
            const year = weekFromNow.getFullYear()
            const month = String(weekFromNow.getMonth() + 1).padStart(2, '0')
            const day = String(weekFromNow.getDate()).padStart(2, '0')
            const weekFromNowStr = `${year}-${month}-${day}`
            
            // Include today through 7 days from now
            return aptDateStr >= todayStr && aptDateStr <= weekFromNowStr && apt.status !== 'cancelled'
          }).length.toString()}
          subtitle="appointments"
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Expected Revenue"
          value={`$${appointments
            .filter(apt => {
              // Normalize appointment date to YYYY-MM-DD for comparison
              const aptDateStr = normalizeDate(apt.scheduled_date)
              const todayStr = getToday()
              // Include today and all future appointments
              return aptDateStr >= todayStr && apt.status !== 'cancelled' && apt.total_amount !== null
            })
            .reduce((sum, apt) => sum + (apt.total_amount || 0), 0)
            .toFixed(0)}`}
          subtitle="upcoming"
          icon={Calendar}
          color="purple"
        />
        </div>
        </>
      )}
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  color 
}: { 
  title: string
  value: string
  subtitle: string
  icon: any
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
    green: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400'
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </div>
  )
}

function AppointmentCard({ 
  appointment, 
  formatTime,
  onConfirm,
  isConfirming,
  onReschedule,
  onCancel,
  onSendReminder,
  onViewDetails,
  onClear,
  actionLoading
}: { 
  appointment: Appointment
  formatTime: (time: string) => string
  onConfirm?: (appointmentId: string) => void
  isConfirming?: boolean
  onReschedule?: (appointment: Appointment) => void
  onCancel?: (appointment: Appointment) => void
  onSendReminder?: (appointmentId: string) => void
  onViewDetails?: (appointment: Appointment) => void
  onClear?: (appointmentId: string) => void
  actionLoading?: string | null
}) {
  const statusConfig: Record<string, { icon: any, color: string, label: string }> = {
    confirmed: {
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
      label: 'Confirmed'
    },
    pending: {
      icon: AlertCircle,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400',
      label: 'Pending'
    },
    in_progress: {
      icon: Clock,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
      label: 'In Progress'
    },
    completed: {
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
      label: 'Completed'
    },
    cancelled: {
      icon: XCircle,
      color: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
      label: 'Cancelled'
    },
    no_show: {
      icon: XCircle,
      color: 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400',
      label: 'No Show'
    }
  }

  const status = statusConfig[appointment.status] || statusConfig.pending
  const StatusIcon = status.icon
  const customer = appointment.customers

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Car className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-foreground">{customer.name}</div>
            <div className="text-sm text-muted-foreground">{appointment.service_type}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-medium text-foreground">{formatTime(appointment.scheduled_time)}</div>
          <div className="text-sm text-muted-foreground">{new Date(appointment.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
          <StatusIcon className="h-3 w-3 inline mr-1" />
          {status.label}
        </span>
        {appointment.total_amount && (
          <span className="text-sm font-medium text-foreground">${appointment.total_amount.toFixed(2)}</span>
        )}
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        {customer.address && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            {customer.address}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3" />
          {customer.phone}
        </div>
        {customer.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3" />
            {customer.email}
          </div>
        )}
      </div>

      {appointment.notes && (
        <div className="mt-3 p-2 bg-muted rounded text-sm text-muted-foreground">
          <strong>Notes:</strong> {appointment.notes}
        </div>
      )}

      <div className="flex gap-2 mt-4 flex-wrap">
        {appointment.status === 'pending' && (
          <Button 
            size="sm" 
            onClick={() => onConfirm?.(appointment.id)}
            disabled={isConfirming}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Confirm
              </>
            )}
          </Button>
        )}
        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
          <>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onReschedule?.(appointment)}
              disabled={!!actionLoading}
            >
              Reschedule
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onCancel?.(appointment)}
              disabled={!!actionLoading}
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              Cancel
            </Button>
          </>
        )}
        {appointment.status !== 'cancelled' && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onSendReminder?.(appointment.id)}
            disabled={!!actionLoading || actionLoading === `reminder-${appointment.id}`}
          >
            {actionLoading === `reminder-${appointment.id}` ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reminder'
            )}
          </Button>
        )}
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onViewDetails?.(appointment)}
          disabled={!!actionLoading}
        >
          View Details
        </Button>
        {appointment.status === 'cancelled' && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onClear?.(appointment.id)}
            disabled={!!actionLoading || actionLoading === `clear-${appointment.id}`}
            className="text-gray-600 hover:text-gray-700 hover:border-gray-300"
          >
            {actionLoading === `clear-${appointment.id}` ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Clearing...
              </>
            ) : (
              'Clear'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// Reschedule Modal
function RescheduleModal({
  appointment,
  formatTime,
  onClose,
  onSubmit,
  isLoading
}: {
  appointment: Appointment
  formatTime: (time: string) => string
  onClose: () => void
  onSubmit: (reason: string) => void
  isLoading: boolean
}) {
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim().length === 0) {
      alert('Please provide a reason for rescheduling')
      return
    }
    onSubmit(reason.trim())
  }

  const appointmentDate = new Date(appointment.scheduled_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Reschedule Appointment</h2>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Customer: <span className="font-medium text-foreground">{appointment.customers.name}</span></p>
            <p className="text-sm text-muted-foreground mb-1">Service: <span className="font-medium text-foreground">{appointment.service_type}</span></p>
            <p className="text-sm text-muted-foreground">Date & Time: <span className="font-medium text-foreground">{appointmentDate} at {formatTime(appointment.scheduled_time)}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="reschedule-reason">Reason for Rescheduling *</Label>
              <textarea
                id="reschedule-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why this appointment needs to be rescheduled..."
                className="w-full mt-2 p-3 border border-input bg-background rounded-md text-sm min-h-[100px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || reason.trim().length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reschedule Notice'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Cancel Modal
function CancelModal({
  appointment,
  formatTime,
  onClose,
  onSubmit,
  isLoading
}: {
  appointment: Appointment
  formatTime: (time: string) => string
  onClose: () => void
  onSubmit: (reason: string) => void
  isLoading: boolean
}) {
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim().length === 0) {
      alert('Please provide a reason for cancellation')
      return
    }
    onSubmit(reason.trim())
  }

  const appointmentDate = new Date(appointment.scheduled_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Cancel Appointment</h2>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">⚠️ This action cannot be undone</p>
            <p className="text-sm text-muted-foreground mb-1">Customer: <span className="font-medium text-foreground">{appointment.customers.name}</span></p>
            <p className="text-sm text-muted-foreground mb-1">Service: <span className="font-medium text-foreground">{appointment.service_type}</span></p>
            <p className="text-sm text-muted-foreground">Date & Time: <span className="font-medium text-foreground">{appointmentDate} at {formatTime(appointment.scheduled_time)}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cancel-reason">Reason for Cancellation *</Label>
              <textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why this appointment is being cancelled..."
                className="w-full mt-2 p-3 border border-input bg-background rounded-md text-sm min-h-[100px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Keep Appointment
              </Button>
              <Button type="submit" variant="destructive" disabled={isLoading || reason.trim().length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Appointment'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// View Details Modal
function ViewDetailsModal({
  appointment,
  formatTime,
  onClose
}: {
  appointment: Appointment
  formatTime: (time: string) => string
  onClose: () => void
}) {
  const appointmentDate = new Date(appointment.scheduled_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const statusConfig: Record<string, { icon: any, color: string, label: string }> = {
    confirmed: {
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
      label: 'Confirmed'
    },
    pending: {
      icon: AlertCircle,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400',
      label: 'Pending'
    },
    in_progress: {
      icon: Clock,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
      label: 'In Progress'
    },
    completed: {
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
      label: 'Completed'
    },
    cancelled: {
      icon: XCircle,
      color: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
      label: 'Cancelled'
    },
    no_show: {
      icon: XCircle,
      color: 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400',
      label: 'No Show'
    }
  }

  const status = statusConfig[appointment.status] || statusConfig.pending
  const StatusIcon = status.icon
  const customer = appointment.customers

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Appointment Details</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Status */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Status</Label>
              <div className="mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                  <StatusIcon className="h-3 w-3 inline mr-1" />
                  {status.label}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Customer Information</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{customer.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Details */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Appointment Details</Label>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Service: </span>
                  <span className="text-foreground font-medium">{appointment.service_type}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Date: </span>
                  <span className="text-foreground font-medium">{appointmentDate}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Time: </span>
                  <span className="text-foreground font-medium">{formatTime(appointment.scheduled_time)}</span>
                </div>
                {appointment.total_amount && (
                  <div>
                    <span className="text-sm text-muted-foreground">Amount: </span>
                    <span className="text-foreground font-medium">${appointment.total_amount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Customer Notes</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{appointment.notes}</p>
                </div>
              </div>
            )}

            {!appointment.notes && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Customer Notes</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground italic">No notes provided</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Calendar View Component
function CalendarView({
  appointments,
  currentMonth,
  onMonthChange,
  formatTime,
  onConfirm,
  confirmingId,
  onReschedule,
  onCancel,
  onSendReminder,
  onViewDetails,
  onClear,
  actionLoading
}: {
  appointments: Appointment[]
  currentMonth: Date
  onMonthChange: (date: Date) => void
  formatTime: (time: string) => string
  onConfirm?: (appointmentId: string) => void
  confirmingId?: string | null
  onReschedule?: (appointment: Appointment) => void
  onCancel?: (appointment: Appointment) => void
  onSendReminder?: (appointmentId: string) => void
  onViewDetails?: (appointment: Appointment) => void
  onClear?: (appointmentId: string) => void
  actionLoading?: string | null
}) {
  const normalizeDate = (dateStr: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }
    if (dateStr.includes(' ')) {
      return dateStr.split(' ')[0]
    }
    const dateMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      return dateMatch[0]
    }
    const parts = dateStr.split(/[-/]/)
    if (parts.length >= 3) {
      const year = parts[0].padStart(4, '0')
      const month = parts[1].padStart(2, '0')
      const day = parts[2].padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return dateStr
  }

  // Get first day of month and number of days
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Group appointments by date
  const appointmentsByDate = new Map<string, Appointment[]>()
  appointments.forEach(apt => {
    const dateKey = normalizeDate(apt.scheduled_date)
    if (!appointmentsByDate.has(dateKey)) {
      appointmentsByDate.set(dateKey, [])
    }
    appointmentsByDate.get(dateKey)!.push(apt)
  })

  // Navigate months
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(month - 1)
    onMonthChange(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(month + 1)
    onMonthChange(newDate)
  }

  const goToToday = () => {
    onMonthChange(new Date())
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Check if a date is today
  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: number): Appointment[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return appointmentsByDate.get(dateStr) || []
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
        <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
          ← Previous
        </Button>
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            {monthNames[month]} {year}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToNextMonth}>
          Next →
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card border border-border rounded-lg p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayAppointments = getAppointmentsForDay(day)
            const isTodayDate = isToday(day)

            return (
              <div
                key={day}
                className={`aspect-square border border-border rounded-lg p-2 ${
                  isTodayDate ? 'bg-primary/10 border-primary' : 'bg-background'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-primary' : 'text-foreground'}`}>
                  {day}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[80px]">
                  {dayAppointments.slice(0, 3).map(apt => (
                    <div
                      key={apt.id}
                      className="text-xs bg-primary/20 text-primary rounded px-1 py-0.5 truncate cursor-pointer hover:bg-primary/30"
                      onClick={() => onViewDetails?.(apt)}
                      title={`${apt.customers.name} - ${formatTime(apt.scheduled_time)}`}
                    >
                      {formatTime(apt.scheduled_time)} {apt.customers.name.split(' ')[0]}
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Day Appointments (if any) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          All Appointments - {monthNames[month]} {year}
        </h2>
        {appointments.filter(apt => {
          const aptDate = normalizeDate(apt.scheduled_date)
          const aptYear = parseInt(aptDate.split('-')[0])
          const aptMonth = parseInt(aptDate.split('-')[1])
          return aptYear === year && aptMonth === month + 1
        }).length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No appointments scheduled for this month</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments
              .filter(apt => {
                const aptDate = normalizeDate(apt.scheduled_date)
                const aptYear = parseInt(aptDate.split('-')[0])
                const aptMonth = parseInt(aptDate.split('-')[1])
                return aptYear === year && aptMonth === month + 1
              })
              .sort((a, b) => {
                const dateA = normalizeDate(a.scheduled_date)
                const dateB = normalizeDate(b.scheduled_date)
                if (dateA !== dateB) return dateA.localeCompare(dateB)
                return a.scheduled_time.localeCompare(b.scheduled_time)
              })
              .map((appointment) => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  formatTime={formatTime}
                  onConfirm={onConfirm}
                  isConfirming={confirmingId === appointment.id}
                  onReschedule={onReschedule}
                  onCancel={onCancel}
                  onSendReminder={onSendReminder}
                  onViewDetails={onViewDetails}
                  onClear={onClear}
                  actionLoading={actionLoading}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

