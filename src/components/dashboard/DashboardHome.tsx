'use client'

import { useState, useEffect } from 'react'
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
  Car,
  Loader2
} from 'lucide-react'

// Real data types
interface DashboardStats {
  todayAppointments: number
  weekRevenue: number
  totalCustomers: number
  pendingAppointments: number
}

interface UpcomingAppointment {
  id: string
  time: string
  customer: string
  service: string
  status: string
}

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weekRevenue: 0,
    totalCustomers: 0,
    pendingAppointments: 0
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingUrl, setBookingUrl] = useState<string>('')
  const [detailerId, setDetailerId] = useState<string>('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Get auth token
        const token = localStorage.getItem('auth_token')
        if (!token) {
          console.error('No auth token found')
          setLoading(false)
          return
        }

        // Get user info to find detailer_id
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        const userData = await userResponse.json()
        if (userData.success && userData.user?.detailer_id) {
          const userDetailerId = userData.user.detailer_id
          setDetailerId(userDetailerId)
          // Set booking URL
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002'
          setBookingUrl(`${baseUrl}/book/${userDetailerId}`)
        }
        
        // Fetch appointments
        const appointmentsResponse = await fetch('/api/appointments', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        const appointmentsData = await appointmentsResponse.json()
        if (!appointmentsData.success) {
          throw new Error(appointmentsData.error || 'Failed to fetch appointments')
        }
        
        const appointments = appointmentsData.appointments || []
        
        // Calculate today's appointments
        const today = new Date().toISOString().split('T')[0]
        const todayAppointments = appointments.filter(apt => apt.scheduled_date === today)
        
        // Calculate week revenue (last 7 days)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekAppointments = appointments.filter(apt => 
          new Date(apt.scheduled_date) >= weekAgo && 
          apt.payment_status === 'paid'
        )
        const weekRevenue = weekAppointments.reduce((sum, apt) => sum + (apt.total_amount || 0), 0)
        
        // Calculate pending appointments
        const pendingAppointments = appointments.filter(apt => 
          apt.status === 'pending' || apt.status === 'confirmed'
        )
        
        // Get unique customers count
        const uniqueCustomers = new Set(appointments.map(apt => apt.customer_id)).size
        
        // Get today's upcoming appointments
        const todayUpcoming = todayAppointments
          .filter(apt => apt.status === 'confirmed' || apt.status === 'pending')
          .map(apt => ({
            id: apt.id,
            time: formatTime(apt.scheduled_time),
            customer: (apt as any).customers?.name || 'Unknown Customer',
            service: apt.service_type,
            status: apt.status
          }))
          .sort((a, b) => {
            // Sort by time (convert to comparable format)
            const timeA = a.time.includes('AM') ? a.time.replace(' AM', '').replace(':', '') : 
                         a.time.includes('PM') ? (parseInt(a.time.replace(' PM', '').replace(':', '')) + 1200).toString() : a.time
            const timeB = b.time.includes('AM') ? b.time.replace(' AM', '').replace(':', '') : 
                         b.time.includes('PM') ? (parseInt(b.time.replace(' PM', '').replace(':', '')) + 1200).toString() : b.time
            return timeA.localeCompare(timeB)
          })

        setStats({
          todayAppointments: todayAppointments.length,
          weekRevenue: Math.round(weekRevenue),
          totalCustomers: uniqueCustomers,
          pendingAppointments: pendingAppointments.length
        })
        
        setUpcomingAppointments(todayUpcoming)
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Set empty stats on error
        setStats({
          todayAppointments: 0,
          weekRevenue: 0,
          totalCustomers: 0,
          pendingAppointments: 0
        })
        setUpcomingAppointments([])
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatTime = (time: string): string => {
    // Convert HH:MM:SS to 12-hour format
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const copyBookingUrl = () => {
    if (bookingUrl) {
      navigator.clipboard.writeText(bookingUrl)
      alert('Booking URL copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2 sm:mb-3">
              Welcome back! 👋
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">Here's what's happening with your business today.</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            icon={Calendar}
            label="Today"
            value={stats.todayAppointments.toString()}
            subtitle="appointments"
            color="blue"
          />
          <StatCard
            icon={DollarSign}
            label="This Week"
            value={`$${stats.weekRevenue}`}
            subtitle="revenue"
            color="green"
          />
          <StatCard
            icon={Users}
            label="Total"
            value={stats.totalCustomers.toString()}
            subtitle="customers"
            color="purple"
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pendingAppointments.toString()}
            subtitle="appointments"
            color="orange"
          />
        </div>

        {/* Booking URL Card */}
        {bookingUrl && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-purple-200/50 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Your Booking Page</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">Share this link with customers to let them book appointments online:</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-white rounded-xl p-4 border border-purple-200/50">
              <input
                type="text"
                value={bookingUrl}
                readOnly
                className="flex-1 bg-transparent text-gray-900 font-mono text-xs sm:text-sm focus:outline-none min-h-[44px] px-2"
              />
              <Button
                onClick={copyBookingUrl}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg transition-all h-12 sm:h-11 w-full sm:w-auto"
              >
                Copy Link
              </Button>
            </div>
            <div className="mt-4">
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 font-semibold underline text-sm sm:text-base"
              >
                Preview booking page →
              </a>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <a href="/schedule" className="group relative overflow-hidden flex items-center min-h-[80px] sm:min-h-[100px] p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl sm:rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="ml-4 sm:ml-6 text-left">
                <p className="font-bold text-gray-900 text-lg sm:text-xl">New Appointment</p>
                <p className="text-sm sm:text-base text-gray-600">Schedule a new service</p>
              </div>
            </a>
            <a href="/customers" className="group relative overflow-hidden flex items-center min-h-[80px] sm:min-h-[100px] p-4 sm:p-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 rounded-xl sm:rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="ml-4 sm:ml-6 text-left">
                <p className="font-bold text-gray-900 text-lg sm:text-xl">Add Customer</p>
                <p className="text-sm sm:text-base text-gray-600">Create new customer profile</p>
              </div>
            </a>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Today's Schedule</h2>
            <a href="/schedule" className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 text-center min-h-[44px] flex items-center justify-center">
              View All
            </a>
          </div>
          
          <div className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-600 text-base sm:text-lg">No appointments scheduled for today</p>
                <p className="text-gray-500 text-sm sm:text-base">Great time to catch up on other tasks!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-600 text-base sm:text-lg">No recent activity</p>
              <p className="text-gray-500 text-sm sm:text-base">Activity will appear here as you use the app</p>
            </div>
          </div>
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
  const colorConfig = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200/50'
    },
    green: {
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'from-emerald-50 to-green-50',
      border: 'border-emerald-200/50'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'from-purple-50 to-violet-50',
      border: 'border-purple-200/50'
    },
    orange: {
      gradient: 'from-amber-500 to-amber-600',
      bg: 'from-amber-50 to-orange-50',
      border: 'border-amber-200/50'
    }
  }

  const config = colorConfig[color]

  return (
    <div className={`group relative overflow-hidden bg-gradient-to-br ${config.bg} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border ${config.border} p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 group-hover:from-white/30 group-hover:to-white/10 transition-all duration-300"></div>
      <div className="relative">
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className={`p-2 sm:p-3 bg-gradient-to-br ${config.gradient} rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
        </div>
        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{value}</div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium">{subtitle}</div>
        </div>
      </div>
    </div>
  )
}

function AppointmentCard({ appointment }: { appointment: any }) {
  const statusConfig = {
    confirmed: {
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'from-emerald-50 to-green-50',
      border: 'border-emerald-200/50',
      text: 'text-emerald-700'
    },
    pending: {
      gradient: 'from-amber-500 to-amber-600',
      bg: 'from-amber-50 to-orange-50',
      border: 'border-amber-200/50',
      text: 'text-amber-700'
    },
    cancelled: {
      gradient: 'from-red-500 to-red-600',
      bg: 'from-red-50 to-rose-50',
      border: 'border-red-200/50',
      text: 'text-red-700'
    }
  }

  const config = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className={`group relative overflow-hidden bg-gradient-to-r ${config.bg} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border ${config.border} p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/5 group-hover:from-white/30 group-hover:to-white/10 transition-all duration-300"></div>
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Car className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900 text-base sm:text-lg truncate">{appointment.customer}</div>
            <div className="text-gray-600 font-medium text-sm sm:text-base truncate">{appointment.service}</div>
          </div>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="font-bold text-gray-900 text-base sm:text-lg">{appointment.time}</div>
          <div className={`text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r ${config.gradient} text-white shadow-lg inline-block mt-1`}>
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
  const colorConfig = {
    green: {
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'from-emerald-50 to-green-50',
      border: 'border-emerald-200/50'
    },
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200/50'
    },
    orange: {
      gradient: 'from-amber-500 to-amber-600',
      bg: 'from-amber-50 to-orange-50',
      border: 'border-amber-200/50'
    }
  }

  const config = colorConfig[color]

  return (
    <div className={`group relative overflow-hidden bg-gradient-to-r ${config.bg} backdrop-blur-sm rounded-2xl shadow-lg border ${config.border} p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/5 group-hover:from-white/30 group-hover:to-white/10 transition-all duration-300"></div>
      <div className="relative flex items-center gap-4">
        <div className={`p-3 bg-gradient-to-br ${config.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-lg">{text}</div>
          <div className="text-gray-600 font-medium">{time}</div>
        </div>
      </div>
    </div>
  )
}


