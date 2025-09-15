'use client'

import { Button } from '@/components/ui/button'
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
  XCircle
} from 'lucide-react'

// Mock data for now - this will come from the database later
const mockAppointments = [
  {
    id: '1',
    date: '2024-01-20',
    time: '10:00 AM',
    customer: 'Jane Smith',
    service: 'Full Detail',
    address: '123 Main St, Anytown, ST 12345',
    phone: '(555) 123-4567',
    email: 'jane.smith@email.com',
    status: 'confirmed',
    duration: '3 hours',
    price: 150
  },
  {
    id: '2',
    date: '2024-01-20',
    time: '2:00 PM',
    customer: 'Mike Johnson',
    service: 'Wash & Wax',
    address: '456 Oak Ave, Somewhere, ST 67890',
    phone: '(555) 234-5678',
    email: 'mike.j@email.com',
    status: 'pending',
    duration: '1.5 hours',
    price: 75
  },
  {
    id: '3',
    date: '2024-01-21',
    time: '9:00 AM',
    customer: 'Sarah Davis',
    service: 'Interior Detail',
    address: '789 Pine Rd, Elsewhere, ST 11111',
    phone: '(555) 345-6789',
    email: 'sarah.davis@email.com',
    status: 'confirmed',
    duration: '2 hours',
    price: 100
  },
  {
    id: '4',
    date: '2024-01-21',
    time: '1:00 PM',
    customer: 'John Doe',
    service: 'Basic Wash',
    address: '321 Elm St, Nowhere, ST 22222',
    phone: '(555) 456-7890',
    email: 'john.doe@email.com',
    status: 'cancelled',
    duration: '1 hour',
    price: 45
  }
]

export default function SchedulePage() {
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
        <Button variant="default" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Calendar View
        </Button>
        <Button variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          List View
        </Button>
      </div>

      {/* Today's Appointments */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Today's Appointments</h2>
        <div className="space-y-4">
          {mockAppointments
            .filter(apt => apt.date === '2024-01-20')
            .map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
        </div>
      </div>

      {/* Tomorrow's Appointments */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Tomorrow's Appointments</h2>
        <div className="space-y-4">
          {mockAppointments
            .filter(apt => apt.date === '2024-01-21')
            .map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Today"
          value={mockAppointments.filter(apt => apt.date === '2024-01-20').length.toString()}
          subtitle="appointments"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="This Week"
          value="12"
          subtitle="appointments"
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Revenue"
          value="$1,200"
          subtitle="this week"
          icon={Calendar}
          color="purple"
        />
      </div>
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

function AppointmentCard({ appointment }: { appointment: any }) {
  const statusConfig = {
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
    cancelled: {
      icon: XCircle,
      color: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
      label: 'Cancelled'
    }
  }

  const status = statusConfig[appointment.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Car className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-foreground">{appointment.customer}</div>
            <div className="text-sm text-muted-foreground">{appointment.service}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-medium text-foreground">{appointment.time}</div>
          <div className="text-sm text-muted-foreground">{appointment.duration}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
          <StatusIcon className="h-3 w-3 inline mr-1" />
          {status.label}
        </span>
        <span className="text-sm font-medium text-foreground">${appointment.price}</span>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3" />
          {appointment.address}
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3" />
          {appointment.phone}
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-3 w-3" />
          {appointment.email}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button size="sm" variant="outline">Reschedule</Button>
        <Button size="sm" variant="outline">Send Reminder</Button>
        <Button size="sm" variant="outline">View Details</Button>
      </div>
    </div>
  )
}

