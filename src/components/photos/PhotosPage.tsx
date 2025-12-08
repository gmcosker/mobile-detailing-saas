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
  const [photoStats, setPhotoStats] = useState({
    totalPhotos: 0,
    documentedJobs: 0,
    beforePhotos: 0,
    afterPhotos: 0
  })

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
          
          // Calculate photo stats from appointments (async, don't block)
          calculatePhotoStats(data.appointments).catch(err => {
            console.error('Error calculating photo stats:', err)
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

  const calculatePhotoStats = async (appointments: Appointment[]) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      let totalPhotos = 0
      let documentedJobs = 0
      let beforePhotos = 0
      let afterPhotos = 0

      // Count appointments with photos
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
              const photos = photoData.photos
              if (photos.length > 0) {
                documentedJobs++
                totalPhotos += photos.length
                beforePhotos += photos.filter((p: any) => p.photo_type === 'before').length
                afterPhotos += photos.filter((p: any) => p.photo_type === 'after').length
              }
            }
          }
        } catch (error) {
          // Skip if photo fetch fails for this appointment
          console.warn(`Failed to fetch photos for appointment ${appointment.id}:`, error)
        }
      }

      setPhotoStats({
        totalPhotos,
        documentedJobs,
        beforePhotos,
        afterPhotos
      })
    } catch (error) {
      console.error('Error calculating photo stats:', error)
    }
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

  const handleBackToList = () => {
    setSelectedAppointment(null)
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
              <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{photoStats.totalPhotos}</div>
              <div className="text-sm text-muted-foreground">Total Photos</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 dark:bg-green-950 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{photoStats.documentedJobs}</div>
              <div className="text-sm text-muted-foreground">Documented Jobs</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded-lg">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{photoStats.beforePhotos}</div>
              <div className="text-sm text-muted-foreground">Before Photos</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 dark:bg-orange-950 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{photoStats.afterPhotos}</div>
              <div className="text-sm text-muted-foreground">After Photos</div>
            </div>
          </div>
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
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Manage Photos</span>
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



