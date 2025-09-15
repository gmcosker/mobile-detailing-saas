'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import PhotoUpload from './PhotoUpload'
import PhotoGallery from './PhotoGallery'
import { appointmentService } from '@/lib/database'
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

// Mock data for now - in real app this would come from database
const mockAppointments: Appointment[] = [
  {
    id: '1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    detailer_id: '1',
    customer_id: '1',
    scheduled_date: '2024-01-16',
    scheduled_time: '10:00:00',
    service_type: 'Full Detail',
    status: 'completed',
    total_amount: 150,
    notes: null,
    reminder_sent: true,
    payment_status: 'paid',
    stripe_payment_intent_id: null,
    customers: {
      id: '1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '(555) 123-4567',
      address: '123 Main St, City, State',
      notes: null
    }
  },
  {
    id: '2',
    created_at: '2024-01-14T14:00:00Z',
    updated_at: '2024-01-14T14:00:00Z',
    detailer_id: '1',
    customer_id: '2',
    scheduled_date: '2024-01-15',
    scheduled_time: '14:00:00',
    service_type: 'Wash & Wax',
    status: 'in_progress',
    total_amount: 45,
    notes: null,
    reminder_sent: true,
    payment_status: 'pending',
    stripe_payment_intent_id: null,
    customers: {
      id: '2',
      created_at: '2024-01-14T14:00:00Z',
      updated_at: '2024-01-14T14:00:00Z',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      phone: '(555) 987-6543',
      address: '456 Oak Ave, City, State',
      notes: null
    }
  }
]

export default function PhotosPage() {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    // Fetch appointments from database
    const fetchAppointments = async () => {
      try {
        // For now, we'll use a hardcoded detailer ID since we don't have auth yet
        const detailerId = '7eb3efd9-9676-41d8-bb93-57c484beeccb' // From our sample data
        console.log('Fetching appointments for detailer:', detailerId)
        const appointments = await appointmentService.getByDetailer(detailerId)
        console.log('Fetched appointments:', appointments)
        setAppointments(appointments)
      } catch (error) {
        console.error('Error fetching appointments:', error)
        // Fallback to mock data if database fails
        setAppointments(mockAppointments)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAppointments()
  }, [])

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
              <div className="text-2xl font-bold text-foreground">24</div>
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
              <div className="text-2xl font-bold text-foreground">8</div>
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
              <div className="text-2xl font-bold text-foreground">12</div>
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
              <div className="text-2xl font-bold text-foreground">12</div>
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
          {appointments.map((appointment) => (
            <button
              key={appointment.id}
              onClick={() => setSelectedAppointment(appointment)}
              className="w-full p-6 text-left hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-foreground">
                      {appointment.customers?.name}
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
          ))}
        </div>
      </div>
    </div>
  )
}



