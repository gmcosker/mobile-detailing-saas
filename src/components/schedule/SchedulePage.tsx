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
  X,
  ChevronDown,
  ChevronUp
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
  const [newAppointmentModal, setNewAppointmentModal] = useState<{ open: boolean }>({ open: false })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [expandedSections, setExpandedSections] = useState({
    today: true,
    tomorrow: true,
    thisWeek: true,
    upcoming: true
  })
  const [detailerId, setDetailerId] = useState<string>('')

  const toggleSection = (section: 'today' | 'tomorrow' | 'thisWeek' | 'upcoming') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  useEffect(() => {
    fetchAppointments()
    fetchDetailerId()
  }, [])

  const fetchDetailerId = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (data.success && data.user?.detailer_id) {
        setDetailerId(data.user.detailer_id)
      }
    } catch (err) {
      console.error('Error fetching detailer ID:', err)
    }
  }

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Schedule</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your appointments and availability</p>
        </div>
        <Button 
          className="w-full sm:w-auto h-12 sm:h-11"
          onClick={() => setNewAppointmentModal({ open: true })}
        >
          <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Calendar View Toggle */}
      <div className="flex gap-2 sm:gap-3">
        <Button 
          variant={viewMode === 'calendar' ? 'default' : 'outline'} 
          size="sm"
          className="h-12 sm:h-10 flex-1 sm:flex-initial"
          onClick={() => setViewMode('calendar')}
        >
          <Calendar className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
          Calendar View
        </Button>
        <Button 
          variant={viewMode === 'list' ? 'default' : 'outline'} 
          size="sm"
          className="h-12 sm:h-10 flex-1 sm:flex-initial"
          onClick={() => setViewMode('list')}
        >
          <Clock className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
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
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer min-h-[44px] px-2 -mx-2"
          onClick={() => toggleSection('today')}
        >
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Today's Appointments</h2>
          <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10">
            {expandedSections.today ? (
              <ChevronUp className="h-5 w-5 sm:h-4 sm:w-4" />
            ) : (
              <ChevronDown className="h-5 w-5 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
        {expandedSections.today && (
          <>
            {todayAppointments.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-muted-foreground">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
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
          </>
        )}
      </div>

      {/* Tomorrow's Appointments */}
      <div>
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer"
          onClick={() => toggleSection('tomorrow')}
        >
          <h2 className="text-lg font-semibold text-foreground">Tomorrow's Appointments</h2>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {expandedSections.tomorrow ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        {expandedSections.tomorrow && (
          <>
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
          </>
        )}
      </div>

      {/* This Week's Appointments */}
      {thisWeekAppointments.length > 0 && (
        <div>
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer"
            onClick={() => toggleSection('thisWeek')}
          >
            <h2 className="text-lg font-semibold text-foreground">This Week's Appointments</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {expandedSections.thisWeek ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          {expandedSections.thisWeek && (
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
          )}
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div>
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer"
            onClick={() => toggleSection('upcoming')}
          >
            <h2 className="text-lg font-semibold text-foreground">Upcoming Appointments</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {expandedSections.upcoming ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          {expandedSections.upcoming && (
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
          )}
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

      {newAppointmentModal.open && (
        <NewAppointmentModal
          detailerId={detailerId}
          onClose={() => setNewAppointmentModal({ open: false })}
          onSuccess={() => {
            setNewAppointmentModal({ open: false })
            fetchAppointments()
          }}
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
    <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-primary/10 p-2 sm:p-2.5 rounded-lg flex-shrink-0">
            <Car className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-base sm:text-sm text-foreground truncate">{customer.name}</div>
            <div className="text-sm sm:text-xs text-muted-foreground truncate">{appointment.service_type}</div>
          </div>
        </div>
        
        <div className="text-left sm:text-right flex-shrink-0">
          <div className="font-medium text-base sm:text-sm text-foreground">{formatTime(appointment.scheduled_time)}</div>
          <div className="text-sm sm:text-xs text-muted-foreground">{new Date(appointment.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
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

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mt-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          {appointment.status === 'pending' && (
            <Button 
              size="sm" 
              onClick={() => onConfirm?.(appointment.id)}
              disabled={isConfirming}
              className="bg-green-600 hover:bg-green-700 text-white h-12 sm:h-10 w-full sm:w-auto"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" />
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
                className="h-12 sm:h-10 w-full sm:w-auto"
              >
                Reschedule
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onCancel?.(appointment)}
                disabled={!!actionLoading}
                className="text-red-600 hover:text-red-700 hover:border-red-300 h-12 sm:h-10 w-full sm:w-auto"
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
              className="h-12 sm:h-10 w-full sm:w-auto"
            >
              {actionLoading === `reminder-${appointment.id}` ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reminder'
              )}
            </Button>
          )}
        </div>
        <Button 
          size="sm"
          className="h-12 sm:h-10 w-full sm:w-auto" 
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
            className="text-gray-600 hover:text-gray-700 hover:border-gray-300 h-12 sm:h-10 w-full sm:w-auto"
          >
            {actionLoading === `clear-${appointment.id}` ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1 animate-spin" />
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Reschedule Appointment</h2>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading} className="h-11 w-11 sm:h-10 sm:w-10">
              <X className="h-6 w-6 sm:h-5 sm:w-5" />
            </Button>
          </div>

          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Customer: <span className="font-medium text-foreground">{appointment.customers.name}</span></p>
            <p className="text-sm text-muted-foreground mb-1">Service: <span className="font-medium text-foreground">{appointment.service_type}</span></p>
            <p className="text-sm text-muted-foreground">Date & Time: <span className="font-medium text-foreground">{appointmentDate} at {formatTime(appointment.scheduled_time)}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="reschedule-reason" className="text-sm sm:text-base">Reason for Rescheduling *</Label>
              <textarea
                id="reschedule-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why this appointment needs to be rescheduled..."
                className="w-full mt-2 p-3 border border-input bg-background rounded-md text-base sm:text-sm min-h-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="h-12 sm:h-11 w-full sm:w-auto order-2 sm:order-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || reason.trim().length === 0} className="h-12 sm:h-11 w-full sm:w-auto order-1 sm:order-2">
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Cancel Appointment</h2>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading} className="h-11 w-11 sm:h-10 sm:w-10">
              <X className="h-6 w-6 sm:h-5 sm:w-5" />
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
              <Label htmlFor="cancel-reason" className="text-sm sm:text-base">Reason for Cancellation *</Label>
              <textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why this appointment is being cancelled..."
                className="w-full mt-2 p-3 border border-input bg-background rounded-md text-base sm:text-sm min-h-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
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

// New Appointment Modal
function NewAppointmentModal({
  detailerId,
  onClose,
  onSuccess
}: {
  detailerId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone: string; email: string | null }>>([])
  const [services, setServices] = useState<Array<{ id: string; name: string; price: number }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    service_id: '',
    service_name: '',
    service_price: '',
    scheduled_date: '',
    scheduled_time: '',
    total_amount: '',
    notes: ''
  })

  const [createNewCustomer, setCreateNewCustomer] = useState(false)

  useEffect(() => {
    if (detailerId) {
      fetchCustomers()
      fetchServices()
    }
  }, [detailerId])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (data.success && data.customers) {
        setCustomers(data.customers)
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
    }
  }

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/services?activeOnly=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (data.success && data.services) {
        setServices(data.services)
      }
    } catch (err) {
      console.error('Error fetching services:', err)
    }
  }

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email || ''
      }))
      setCreateNewCustomer(false)
    }
  }

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setFormData(prev => ({
        ...prev,
        service_id: serviceId,
        service_name: service.name,
        service_price: service.price.toString()
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Not authenticated. Please log in again.')
        return
      }

      let customerId = formData.customer_id

      // If creating a new customer
      if (createNewCustomer || !customerId) {
        if (!formData.customer_name || !formData.customer_phone) {
          alert('Customer name and phone are required')
          setIsSubmitting(false)
          return
        }

        // Create customer
        const customerResponse = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.customer_name,
            phone: formData.customer_phone,
            email: formData.customer_email || null,
            address: formData.customer_address || null
          })
        })

        const customerData = await customerResponse.json()
        if (!customerResponse.ok || !customerData.success) {
          throw new Error(customerData.error || 'Failed to create customer')
        }

        customerId = customerData.customer.id
      }

      // Validate required fields
      if (!formData.scheduled_date || !formData.scheduled_time) {
        alert('Date and time are required')
        setIsSubmitting(false)
        return
      }

      // Validate date is in future
      const appointmentDate = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`)
      const now = new Date()
      if (appointmentDate <= now) {
        alert('Appointment date and time must be in the future')
        setIsSubmitting(false)
        return
      }

      // Get service name
      let serviceType = formData.service_name
      if (!serviceType && formData.service_id) {
        const service = services.find(s => s.id === formData.service_id)
        serviceType = service?.name || 'Custom Service'
      }
      if (!serviceType) {
        serviceType = 'Custom Service'
      }

      // Get amount
      let totalAmount: number | null = null
      if (formData.total_amount) {
        totalAmount = parseFloat(formData.total_amount)
        if (isNaN(totalAmount) || totalAmount < 0) {
          alert('Invalid amount')
          setIsSubmitting(false)
          return
        }
      } else if (formData.service_price) {
        totalAmount = parseFloat(formData.service_price)
      }

      // Get detailer UUID
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const userData = await userResponse.json()
      if (!userData.success || !userData.user?.detailer_id) {
        throw new Error('Failed to get detailer information')
      }

      // Create appointment
      const appointmentResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          detailer_id: userData.user.detailer_id,
          customer_id: customerId,
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time.includes(':') && formData.scheduled_time.split(':').length === 2 
            ? `${formData.scheduled_time}:00` 
            : formData.scheduled_time,
          service_type: serviceType,
          total_amount: totalAmount,
          notes: formData.notes || null
        })
      })

      const appointmentData = await appointmentResponse.json()
      if (!appointmentResponse.ok || !appointmentData.success) {
        throw new Error(appointmentData.error || 'Failed to create appointment')
      }

      alert('Appointment created successfully!')
      onSuccess()
    } catch (err: any) {
      console.error('Error creating appointment:', err)
      alert(err.message || 'Failed to create appointment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">New Appointment</h2>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div>
              <Label htmlFor="customer-select" className="mb-2 block">Customer *</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={!createNewCustomer ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreateNewCustomer(false)}
                >
                  Select Existing
                </Button>
                <Button
                  type="button"
                  variant={createNewCustomer ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCreateNewCustomer(true)
                    setFormData(prev => ({ ...prev, customer_id: '' }))
                  }}
                >
                  Create New
                </Button>
              </div>

              {!createNewCustomer ? (
                <select
                  id="customer-select"
                  value={formData.customer_id}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full p-2 border border-input bg-background rounded-md"
                  required={!createNewCustomer}
                >
                  <option value="">Select a customer...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="customer_name">Name *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      required={createNewCustomer}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Phone *</Label>
                    <Input
                      id="customer_phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                      required={createNewCustomer}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_email">Email</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_address">Address</Label>
                    <Input
                      id="customer_address"
                      value={formData.customer_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Service Selection */}
            <div>
              <Label htmlFor="service-select" className="mb-2 block">Service *</Label>
              <select
                id="service-select"
                value={formData.service_id}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full p-2 border border-input bg-background rounded-md"
              >
                <option value="">Select a service or enter custom...</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - ${service.price.toFixed(2)}
                  </option>
                ))}
              </select>
              {!formData.service_id && (
                <div className="mt-2">
                  <Label htmlFor="service_name">Custom Service Name</Label>
                  <Input
                    id="service_name"
                    value={formData.service_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                    placeholder="Enter service name"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled_date">Date *</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  min={getTodayDate()}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="scheduled_time">Time *</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="total_amount">Amount</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                placeholder={formData.service_price ? `Default: $${formData.service_price}` : 'Enter amount'}
                className="mt-1"
              />
              {formData.service_price && !formData.total_amount && (
                <p className="text-xs text-muted-foreground mt-1">
                  Will use service price: ${formData.service_price}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this appointment..."
                className="w-full mt-1 p-3 border border-input bg-background rounded-md text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Appointment'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

