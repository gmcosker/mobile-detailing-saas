'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import PhotoUpload from './PhotoUpload'
import PhotoGallery from './PhotoGallery'
// Removed direct database import - using API endpoints instead
import type { Database } from '@/lib/supabase'
import { 
  Camera, 
  Calendar, 
  User, 
  Clock,
  Plus,
  ArrowLeft
} from 'lucide-react'

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  customers?: Database['public']['Tables']['customers']['Row']
}

export default function PhotosPage() {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [appointmentPhotoCounts, setAppointmentPhotoCounts] = useState<Record<string, { before: number; after: number }>>({})

  useEffect(() => {
    // Fetch appointments from API (filtered by authenticated user)
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          console.error('No auth token found')
          setLoading(false)
          return
        }

        const response = await fetch('/api/appointments?limit=100', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch appointments')
        }

        const data = await response.json()
        if (data.success && data.appointments) {
          console.log('Fetched appointments:', data.appointments.length)
          setAppointments(data.appointments)
          
          // Fetch photo counts for each appointment
          fetchPhotoCountsForAppointments(data.appointments, token).catch(err => {
            console.error('Error fetching photo counts:', err)
          })
        } else {
          console.error('Failed to fetch appointments:', data.error)
          setAppointments([])
        }
      } catch (error) {
        console.error('Error fetching appointments:', error)
        setAppointments([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchAppointments()
  }, [])

  // Refresh photo counts when returning from photo management
  useEffect(() => {
    if (appointments.length > 0 && !selectedAppointment) {
      const token = localStorage.getItem('auth_token')
      if (token) {
        fetchPhotoCountsForAppointments(appointments, token).catch(err => {
          console.error('Error refreshing photo counts:', err)
        })
      }
    }
  }, [selectedAppointment, appointments.length])

  const fetchPhotoCountsForAppointments = async (appointments: Appointment[], token: string) => {
    const counts: Record<string, { before: number; after: number }> = {}

    // Fetch photo counts for each appointment
    for (const appointment of appointments) {
      try {
        const photoResponse = await fetch(`/api/photos/appointment/${appointment.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (photoResponse.ok) {
          const photoData = await photoResponse.json()
          if (photoData.success && photoData.photos) {
            const photos = photoData.photos as Array<{ photo_type: string }>
            const beforeCount = photos.filter(p => p.photo_type === 'before').length
            const afterCount = photos.filter(p => p.photo_type === 'after').length
            counts[appointment.id] = { before: beforeCount, after: afterCount }
          } else {
            counts[appointment.id] = { before: 0, after: 0 }
          }
        } else {
          counts[appointment.id] = { before: 0, after: 0 }
        }
      } catch (error) {
        // Default to 0 if fetch fails
        console.warn(`Failed to fetch photos for appointment ${appointment.id}:`, error)
        counts[appointment.id] = { before: 0, after: 0 }
      }
    }

    setAppointmentPhotoCounts(counts)
  }

  // Force refresh photos when navigating back to this page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedAppointment) {
        console.log('Page became visible, refreshing photos...')
        setRefreshTrigger(prev => prev + 1)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [selectedAppointment])

  const handleBackToList = async () => {
    setSelectedAppointment(null)
    // Refresh photo counts when returning to list
    const token = localStorage.getItem('auth_token')
    if (token && appointments.length > 0) {
      await fetchPhotoCountsForAppointments(appointments, token)
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

  const formatTime = (time: string): string => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400'
      case 'confirmed':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-48">
          <div className="text-center space-y-2">
            <Camera className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Loading appointments...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show selected appointment photos
  if (selectedAppointment) {
    return (
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToList}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {selectedAppointment.customers?.name} - {selectedAppointment.service_type}
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatDate(selectedAppointment.scheduled_date)} at {formatTime(selectedAppointment.scheduled_time)}
            </p>
          </div>
        </div>

        {/* Photo Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PhotoUpload
            appointmentId={selectedAppointment.id}
            photoType="before"
            onUploadComplete={() => {
              console.log('Before photo uploaded')
              setRefreshTrigger(prev => prev + 1) // Trigger gallery refresh
            }}
          />
          
          <PhotoUpload
            appointmentId={selectedAppointment.id}
            photoType="during"
            onUploadComplete={() => {
              console.log('Progress photo uploaded')
              setRefreshTrigger(prev => prev + 1) // Trigger gallery refresh
            }}
          />
          
          <PhotoUpload
            appointmentId={selectedAppointment.id}
            photoType="after"
            onUploadComplete={() => {
              console.log('After photo uploaded')
              setRefreshTrigger(prev => prev + 1) // Trigger gallery refresh
            }}
          />
        </div>

        {/* Photo Gallery */}
        <PhotoGallery
          appointmentId={selectedAppointment.id}
          refreshTrigger={refreshTrigger}
          onPhotoDelete={(photoId) => {
            console.log('Photo deleted:', photoId)
            setRefreshTrigger(prev => prev + 1) // Trigger gallery refresh
          }}
        />
        
        {/* Debug info */}
        <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>Appointment ID: {selectedAppointment.id}</p>
          <p>Customer: {selectedAppointment.customers?.name}</p>
          <p>Refresh Trigger: {refreshTrigger}</p>
        </div>
      </div>
    )
  }

  // Show appointments list
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Photo Management</h2>
          <p className="text-muted-foreground">
            Upload and manage before/after photos for your appointments
          </p>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Appointments</h3>
          <p className="text-sm text-muted-foreground">
            Select an appointment to manage photos
          </p>
        </div>

        <div className="divide-y divide-border">
          {appointments.length === 0 ? (
            <div className="p-8 text-center">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No appointments found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Appointments will appear here once you have completed jobs
              </p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <button
                key={appointment.id}
                onClick={() => setSelectedAppointment(appointment)}
                className="w-full p-6 text-left hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-foreground">
                        {appointment.customers?.name || 'Unknown Customer'}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(appointment.scheduled_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(appointment.scheduled_time)}
                      </span>
                      <span>{appointment.service_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-base font-medium text-foreground">
                      {appointmentPhotoCounts[appointment.id]?.before ?? 0} before photos
                    </div>
                    <div className="text-base font-medium text-foreground">
                      {appointmentPhotoCounts[appointment.id]?.after ?? 0} after photos
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Manage Photos</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}



