'use client'

import { Button } from '@/components/ui/button'
import { 
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  Plus,
  CheckCircle,
  AlertCircle,
  Car
} from 'lucide-react'

// Mock data for now - this will come from the database later
const mockStats = {
  todayAppointments: 3,
  weekRevenue: 1250,
  totalCustomers: 47,
  pendingAppointments: 5
}

const mockUpcoming = [
  {
    id: '1',
    time: '10:00 AM',
    customer: 'Jane Smith',
    service: 'Full Detail',
    status: 'confirmed'
  },
  {
    id: '2',
    time: '2:00 PM',
    customer: 'Mike Johnson',
    service: 'Wash & Wax',
    status: 'pending'
  },
  {
    id: '3',
    time: '4:00 PM',
    customer: 'Sarah Davis',
    service: 'Interior Detail',
    status: 'confirmed'
  }
]

export default function DashboardHome() {
  return (
    <div className="p-4 pb-20 md:pb-4">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={Calendar}
          label="Today"
          value={mockStats.todayAppointments.toString()}
          subtitle="appointments"
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="This Week"
          value={`$${mockStats.weekRevenue}`}
          subtitle="revenue"
          color="green"
        />
        <StatCard
          icon={Users}
          label="Total"
          value={mockStats.totalCustomers.toString()}
          subtitle="customers"
          color="purple"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={mockStats.pendingAppointments.toString()}
          subtitle="appointments"
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="h-20 flex-col gap-2">
            <a href="/schedule">
              <Plus className="h-6 w-6" />
              <span>New Appointment</span>
            </a>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col gap-2">
            <a href="/customers">
              <Users className="h-6 w-6" />
              <span>Add Customer</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Today's Schedule</h2>
          <Button asChild variant="ghost" size="sm">
            <a href="/schedule">View All</a>
          </Button>
        </div>
        
        <div className="space-y-3">
          {mockUpcoming.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Recent Activity</h2>
        <div className="space-y-3">
          <ActivityItem
            icon={CheckCircle}
            text="Completed detail for John Doe"
            time="2 hours ago"
            color="green"
          />
          <ActivityItem
            icon={DollarSign}
            text="Payment received - $150.00"
            time="3 hours ago"
            color="green"
          />
          <ActivityItem
            icon={Calendar}
            text="New appointment booked"
            time="5 hours ago"
            color="blue"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  color 
}: { 
  icon: any
  label: string
  value: string
  subtitle: string
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
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  )
}

function AppointmentCard({ appointment }: { appointment: any }) {
  const statusColors = {
    confirmed: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
    pending: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400',
    cancelled: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
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
          <div className={`text-xs px-2 py-1 rounded-full ${statusColors[appointment.status as keyof typeof statusColors]}`}>
            {appointment.status}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ 
  icon: Icon, 
  text, 
  time, 
  color 
}: { 
  icon: any
  text: string
  time: string
  color: 'green' | 'blue' | 'orange'
}) {
  const colorClasses = {
    green: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400'
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{text}</div>
        <div className="text-xs text-muted-foreground">{time}</div>
      </div>
    </div>
  )
}


