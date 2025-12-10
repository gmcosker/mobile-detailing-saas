'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  X,
  Calendar,
  MessageSquare,
  Send
} from 'lucide-react'

// Helper function to format last service date
function formatLastServiceDate(dateString: string | null): string {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = today.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} month${months > 1 ? 's' : ''} ago`
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Helper function to get days since last service
function getDaysSinceLastService(dateString: string | null): number | null {
  if (!dateString) return null
  
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = today.getTime() - date.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// Mock data for now - this will come from the database later
const mockCustomers = [
  {
    id: '1',
    name: 'Jane Smith',
    phone: '(555) 123-4567',
    email: 'jane.smith@email.com',
    address: '123 Main St, Anytown, ST 12345',
    totalSpent: 450,
    lastVisit: '2024-01-15',
    status: 'active'
  },
  {
    id: '2',
    name: 'Mike Johnson',
    phone: '(555) 234-5678',
    email: 'mike.j@email.com',
    address: '456 Oak Ave, Somewhere, ST 67890',
    totalSpent: 320,
    lastVisit: '2024-01-10',
    status: 'active'
  },
  {
    id: '3',
    name: 'Sarah Davis',
    phone: '(555) 345-6789',
    email: 'sarah.davis@email.com',
    address: '789 Pine Rd, Elsewhere, ST 11111',
    totalSpent: 280,
    lastVisit: '2024-01-08',
    status: 'active'
  },
  {
    id: '4',
    name: 'John Doe',
    phone: '(555) 456-7890',
    email: 'john.doe@email.com',
    address: '321 Elm St, Nowhere, ST 22222',
    totalSpent: 150,
    lastVisit: '2024-01-05',
    status: 'inactive'
  }
]

export default function CustomersPage() {
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customers, setCustomers] = useState(mockCustomers)
  const [allCustomers, setAllCustomers] = useState(mockCustomers) // Store all customers for filtering
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDays, setFilterDays] = useState<string>('all') // 'all', '30', '60', '90', '180', '365'
  const [showFilters, setShowFilters] = useState(false)
  const [detailerId, setDetailerId] = useState<string>('')
  const fetchCustomersRef = useRef<() => Promise<void>>()

  // Fetch customers from API and calculate last service dates
  const fetchCustomers = async () => {
    setIsFetching(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        console.error('No auth token found')
        return
      }

      // Fetch customers
      const customersResponse = await fetch('/api/customers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const customersData = await customersResponse.json()

      if (!customersResponse.ok || !customersData.success || !customersData.customers) {
        console.error('Failed to fetch customers:', customersData.error)
        setCustomers([])
        setAllCustomers([])
        return
      }

      // Fetch appointments to calculate last service dates
      const appointmentsResponse = await fetch('/api/appointments?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const appointmentsData = await appointmentsResponse.json()
      const appointments = appointmentsData.success ? appointmentsData.appointments || [] : []

      // Calculate last service date for each customer
      const customerLastServiceMap = new Map<string, string>()
      const customerTotalSpentMap = new Map<string, number>()

      appointments.forEach((apt: any) => {
        if (apt.customer_id && apt.scheduled_date) {
          const customerId = apt.customer_id
          const serviceDate = apt.scheduled_date
          
          // Track most recent service date
          const existingDate = customerLastServiceMap.get(customerId)
          if (!existingDate || serviceDate > existingDate) {
            customerLastServiceMap.set(customerId, serviceDate)
          }
          
          // Calculate total spent
          if (apt.total_amount && apt.payment_status === 'paid') {
            const currentTotal = customerTotalSpentMap.get(customerId) || 0
            customerTotalSpentMap.set(customerId, currentTotal + (apt.total_amount || 0))
          }
        }
      })

      // Transform API data to match component format
      const transformedCustomers = customersData.customers.map((customer: any) => {
        const lastServiceDate = customerLastServiceMap.get(customer.id) || null
        const totalSpent = customerTotalSpentMap.get(customer.id) || 0
        
        // Debug: Log if last_booking_invite_sent_at exists
        if (customer.last_booking_invite_sent_at) {
          console.log(`[DEBUG] Customer ${customer.name} has last_booking_invite_sent_at:`, customer.last_booking_invite_sent_at)
        }
        
        return {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          address: customer.address || '',
          totalSpent: totalSpent,
          lastServiceDate: lastServiceDate,
          lastVisit: lastServiceDate || (customer.updated_at ? new Date(customer.updated_at).toISOString().split('T')[0] : null),
          status: lastServiceDate ? 'active' : 'inactive',
          last_booking_invite_sent_at: customer.last_booking_invite_sent_at || null
        }
      })

      setAllCustomers(transformedCustomers)
      applyFilters(transformedCustomers, searchTerm, filterDays)
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([])
      setAllCustomers([])
    } finally {
      setIsFetching(false)
    }
  }

  // Apply search and filter logic
  const applyFilters = (customersToFilter: any[], search: string, daysFilter: string) => {
    let filtered = [...customersToFilter]

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone.includes(search) ||
        (c.lastServiceDate && formatLastServiceDate(c.lastServiceDate).toLowerCase().includes(searchLower))
      )
    }

    // Apply days filter (customers not serviced in X days)
    if (daysFilter !== 'all') {
      const days = parseInt(daysFilter)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      const cutoffDateString = cutoffDate.toISOString().split('T')[0]

      filtered = filtered.filter(c => {
        if (!c.lastServiceDate) return true // Include customers with no service date
        return c.lastServiceDate < cutoffDateString
      })
    }

    setCustomers(filtered)
  }

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    applyFilters(allCustomers, value, filterDays)
  }

  // Handle filter change
  const handleFilterChange = (days: string) => {
    setFilterDays(days)
    applyFilters(allCustomers, searchTerm, days)
  }

  // Fetch detailer ID on mount
  useEffect(() => {
    const fetchDetailerId = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) return

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user?.detailer_id) {
            setDetailerId(data.user.detailer_id)
          }
        }
      } catch (error) {
        console.error('Error fetching detailer ID:', error)
      }
    }

    fetchDetailerId()
  }, [])

  // Store fetchCustomers in ref so it can be called from modal
  useEffect(() => {
    fetchCustomersRef.current = fetchCustomers
  }, [fetchCustomers])

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddCustomer = async (customerData: {
    name: string
    email?: string
    phone: string
    address?: string
    notes?: string
  }) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        throw new Error('Not authenticated. Please log in again.')
      }

      console.log('Sending customer data:', customerData)
      console.log('Using token:', token.substring(0, 20) + '...')

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(customerData),
      })

      const data = await response.json()

      console.log('Customer API response:', data)

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create customer')
      }

      // Refresh the customer list
      await fetchCustomers()

      setIsAddCustomerOpen(false)
    } catch (error: any) {
      console.error('Error adding customer:', error)
      alert(error.message || 'Failed to add customer. Please check the console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your customer database</p>
        </div>
        <Button 
          className="w-full sm:w-auto h-12 sm:h-11"
          onClick={() => setIsAddCustomerOpen(true)}
        >
          <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers, phone, email, or last service date..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 sm:pl-10 pr-4 py-3 sm:py-2 border border-border rounded-lg bg-background text-base sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] sm:min-h-0"
            />
          </div>
          <Button 
            variant="outline" 
            className="h-12 sm:h-11 w-full sm:w-auto"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
            Filters {filterDays !== 'all' && `(${filterDays}d)`}
          </Button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Filter by Last Service</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterDays('all')
                  applyFilters(allCustomers, searchTerm, 'all')
                }}
                className="h-8 text-xs"
              >
                Clear
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                  filterDays === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                All Customers
              </button>
              <button
                onClick={() => handleFilterChange('30')}
                className={`px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                  filterDays === '30'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                30+ Days
              </button>
              <button
                onClick={() => handleFilterChange('60')}
                className={`px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                  filterDays === '60'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                60+ Days
              </button>
              <button
                onClick={() => handleFilterChange('90')}
                className={`px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                  filterDays === '90'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                90+ Days
              </button>
              <button
                onClick={() => handleFilterChange('180')}
                className={`px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                  filterDays === '180'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                180+ Days
              </button>
              <button
                onClick={() => handleFilterChange('365')}
                className={`px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                  filterDays === '365'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                1+ Year
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Customers"
          value={customers.length.toString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Customers"
          value={customers.filter(c => c.status === 'active').length.toString()}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Prospects"
          value={customers.filter(c => {
            const days = getDaysSinceLastService(c.lastServiceDate)
            return days !== null && days > 30
          }).length.toString()}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Revenue"
          value={`$${customers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(0)}`}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Customers List */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Customer List</h3>
        </div>
        {isFetching ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No customers yet</p>
            <p className="text-sm text-muted-foreground">Click "Add Customer" to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {customers.map((customer) => (
              <CustomerRow 
                key={customer.id} 
                customer={customer}
                onClick={() => setSelectedCustomer(customer)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <AddCustomerModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
          onSave={handleAddCustomer}
          isLoading={isLoading}
        />
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          detailerId={detailerId}
          onClose={() => setSelectedCustomer(null)}
          onCustomerUpdated={async (customerId, updates) => {
            console.log('[DEBUG] onCustomerUpdated called with:', customerId, updates)
            // Update the customer in the list immediately
            setAllCustomers(prev => {
              const updated = prev.map(c => 
                c.id === customerId ? { ...c, ...updates } : c
              )
              console.log('[DEBUG] Updated allCustomers. Customer now has:', updated.find(c => c.id === customerId)?.last_booking_invite_sent_at)
              return updated
            })
            setCustomers(prev => {
              const updated = prev.map(c => 
                c.id === customerId ? { ...c, ...updates } : c
              )
              console.log('[DEBUG] Updated customers. Customer now has:', updated.find(c => c.id === customerId)?.last_booking_invite_sent_at)
              return updated
            })
            // Update selected customer
            setSelectedCustomer(prev => prev ? { ...prev, ...updates } : null)
            // Refresh customer data from API to ensure we have the latest
            if (fetchCustomersRef.current) {
              await fetchCustomersRef.current()
            }
          }}
        />
      )}
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string
  value: string
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
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-2 sm:p-2.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">{value}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">{title}</div>
        </div>
      </div>
    </div>
  )
}

function CustomerRow({ customer, onClick }: { customer: any; onClick: () => void }) {
  const daysSince = getDaysSinceLastService(customer.lastServiceDate)
  const lastServiceFormatted = formatLastServiceDate(customer.lastServiceDate)
  
  // Color coding for last service date
  const getLastServiceColor = () => {
    if (!daysSince) return 'text-gray-500'
    if (daysSince <= 30) return 'text-green-600 dark:text-green-400'
    if (daysSince <= 90) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 sm:p-5 hover:bg-accent/50 active:bg-accent transition-colors min-h-[100px] sm:min-h-0"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <h4 className="font-medium text-base sm:text-sm text-foreground truncate">{customer.name}</h4>
            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
              customer.status === 'active' 
                ? 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
                : 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400'
            }`}>
              {customer.status}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-1 truncate">
              <Phone className="h-3.5 w-3.5 sm:h-3 sm:w-3 flex-shrink-0" />
              <span className="truncate">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-1 truncate">
                <Mail className="h-3.5 w-3.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-1 truncate">
                <MapPin className="h-3.5 w-3.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="truncate">{customer.address}</span>
              </div>
            )}
          </div>

          {/* Last Service Date */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Calendar className={`h-3.5 w-3.5 sm:h-3 sm:w-3 flex-shrink-0 ${getLastServiceColor()}`} />
            <span className={`font-medium ${getLastServiceColor()}`}>
              Last Service: {lastServiceFormatted}
            </span>
            {daysSince !== null && daysSince > 30 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                Prospect
              </span>
            )}
          </div>

          {/* Last Booking Invite Sent */}
          {customer.last_booking_invite_sent_at ? (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 dark:text-blue-400">
              <MessageSquare className="h-3.5 w-3.5 sm:h-3 sm:w-3 flex-shrink-0" />
              <span className="font-medium">
                Last invite: {new Date(customer.last_booking_invite_sent_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          ) : (
            // Debug: Show if customer exists but has no invite timestamp
            process.env.NODE_ENV === 'development' && console.log('[DEBUG] Customer', customer.name, 'has no last_booking_invite_sent_at')
          )}
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-0">
          <div className="text-left sm:text-right">
            <div className="font-medium text-base sm:text-sm text-foreground">${customer.totalSpent.toFixed(2)}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total Spent</div>
          </div>
          
          <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10 flex-shrink-0" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <MoreHorizontal className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </button>
  )
}

interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (customer: {
    name: string
    email?: string
    phone: string
    address?: string
    notes?: string
  }) => void
  isLoading: boolean
}

function AddCustomerModal({ isOpen, onClose, onSave, isLoading }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }

    if (!formData.phone.trim()) {
      setError('Phone is required')
      return
    }

    // Email validation if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format')
      return
    }

    // Call onSave with the form data
    onSave({
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim(),
      address: formData.address.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    })

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Add New Customer</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 w-11 sm:h-10 sm:w-10"
            >
              <X className="h-6 w-6 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm sm:text-base">Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                required
                disabled={isLoading}
                className="h-12 sm:h-11 text-base sm:text-sm"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm sm:text-base">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="555-123-4567"
                required
                disabled={isLoading}
                className="h-12 sm:h-11 text-base sm:text-sm"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john@example.com"
                disabled={isLoading}
                className="h-12 sm:h-11 text-base sm:text-sm"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm sm:text-base">Address</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main St, City, State 12345"
                disabled={isLoading}
                className="h-12 sm:h-11 text-base sm:text-sm"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm sm:text-base">Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this customer..."
                className="flex min-h-[100px] sm:min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                rows={3}
              />
            </div>

            {error && (
              <div className="text-sm sm:text-base text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 sm:p-4">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 sm:h-11 w-full sm:w-auto order-2 sm:order-1"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 sm:h-11 w-full sm:w-auto order-1 sm:order-2"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Customer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

interface CustomerDetailModalProps {
  customer: any
  detailerId: string
  onClose: () => void
  onCustomerUpdated?: (customerId: string, updates: any) => void
}

function CustomerDetailModal({ customer, detailerId, onClose, onCustomerUpdated }: CustomerDetailModalProps) {
  const [personalizedMessage, setPersonalizedMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const bookingLink = typeof window !== 'undefined' && detailerId ? `${window.location.origin}/book/${detailerId}` : ''

  // Default message template
  const defaultMessage = bookingLink 
    ? `Hi ${customer.name}! We'd love to have you back for another service. Book your next appointment here: ${bookingLink}`
    : `Hi ${customer.name}! We'd love to have you back for another service. Please contact us to book your next appointment.`

  const handleSendSMS = async () => {
    if (!customer.phone) {
      setErrorMessage('Customer phone number is required')
      setSendStatus('error')
      return
    }

    if (!detailerId) {
      setErrorMessage('Detailer booking link not available')
      setSendStatus('error')
      return
    }

    setIsSending(true)
    setSendStatus('idle')
    setErrorMessage('')

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Use personalized message or default
      // If personalized message is provided, append booking link if not already included
      let messageToSend = personalizedMessage.trim() || defaultMessage
      
      // If using personalized message and booking link exists, append it if not already in message
      if (personalizedMessage.trim() && bookingLink && !messageToSend.includes(bookingLink)) {
        messageToSend = `${messageToSend}\n\nBook here: ${bookingLink}`
      }

      // Use the booking invite endpoint which tracks the date
      const response = await fetch(`/api/customers/${customer.id}/booking-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageToSend,
          detailerId: detailerId,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSendStatus('success')
        setPersonalizedMessage('')
        // Update customer object with new last_booking_invite_sent_at
        if (data.lastBookingInviteSentAt) {
          console.log('[DEBUG] Booking invite sent, updating timestamp:', data.lastBookingInviteSentAt)
          customer.last_booking_invite_sent_at = data.lastBookingInviteSentAt
          // Notify parent to refresh customer data
          if (onCustomerUpdated) {
            console.log('[DEBUG] Calling onCustomerUpdated with:', customer.id, data.lastBookingInviteSentAt)
            onCustomerUpdated(customer.id, { last_booking_invite_sent_at: data.lastBookingInviteSentAt })
          }
        } else {
          console.warn('[DEBUG] No lastBookingInviteSentAt in response. Full response:', data)
          console.warn('[DEBUG] This likely means the database column "last_booking_invite_sent_at" does not exist. Please run the migration.')
        }
        // Don't auto-close - let user see the success message and updated timestamp
      } else {
        setSendStatus('error')
        setErrorMessage(data.error || 'Failed to send SMS')
        console.error('[DEBUG] SMS send failed:', data)
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error)
      setSendStatus('error')
      setErrorMessage(error.message || 'Failed to send SMS')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Customer Details</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{customer.name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isSending}
              className="h-11 w-11 sm:h-10 sm:w-10"
            >
              <X className="h-6 w-6 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Customer Info */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2 text-sm sm:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{customer.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">
                  Last Service: {formatLastServiceDate(customer.lastServiceDate)}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Total Spent: </span>
                <span className="text-foreground font-medium">${customer.totalSpent.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Last Booking Invite Sent - Prominent Display */}
            {customer.last_booking_invite_sent_at ? (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Last Booking Invite Sent</span>
                    <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      {new Date(customer.last_booking_invite_sent_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Debug: Log if customer exists but has no invite timestamp
              process.env.NODE_ENV === 'development' && console.log('[DEBUG MODAL] Customer', customer.name, 'has no last_booking_invite_sent_at. Value:', customer.last_booking_invite_sent_at)
            )}
          </div>

          {/* SMS Invite Section */}
          <div className="border-t border-border pt-4 sm:pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Send Booking Invite</h3>
            </div>
            
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Send a personalized SMS inviting {customer.name} to book another service. The booking link will be included automatically.
            </p>

            {/* Personalized Message Input */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="personalized-message" className="text-sm sm:text-base">
                Personalized Message (Optional)
              </Label>
              <textarea
                id="personalized-message"
                value={personalizedMessage}
                onChange={(e) => setPersonalizedMessage(e.target.value)}
                placeholder={defaultMessage}
                className="flex min-h-[120px] sm:min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                disabled={isSending}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use default message, or customize it above. The booking link will be added automatically.
              </p>
            </div>

            {/* Booking Link Preview */}
            {bookingLink && (
              <div className="bg-muted rounded-lg p-3 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Booking Link:</p>
                <p className="text-xs sm:text-sm text-foreground break-all font-mono">{bookingLink}</p>
              </div>
            )}

            {/* Status Messages */}
            {sendStatus === 'success' && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ SMS sent successfully!
                </p>
              </div>
            )}

            {sendStatus === 'error' && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {errorMessage || 'Failed to send SMS. Please try again.'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 sm:h-11 w-full sm:w-auto order-2 sm:order-1"
                onClick={onClose}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSendSMS}
                className="flex-1 h-12 sm:h-11 w-full sm:w-auto order-1 sm:order-2"
                disabled={isSending || !customer.phone}
              >
                {isSending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send SMS Invite
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

