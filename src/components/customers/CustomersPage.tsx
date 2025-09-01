'use client'

import { Button } from '@/components/ui/button'
import { 
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'

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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={mockCustomers.length.toString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Customers"
          value={mockCustomers.filter(c => c.status === 'active').length.toString()}
          icon={Users}
          color="green"
        />
        <StatCard
          title="This Month"
          value="12"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Revenue"
          value={`$${mockCustomers.reduce((sum, c) => sum + c.totalSpent, 0)}`}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Customers List */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Customer List</h3>
        </div>
        <div className="divide-y divide-border">
          {mockCustomers.map((customer) => (
            <CustomerRow key={customer.id} customer={customer} />
          ))}
        </div>
      </div>
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
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">{title}</div>
        </div>
      </div>
    </div>
  )
}

function CustomerRow({ customer }: { customer: any }) {
  return (
    <div className="p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-medium text-foreground">{customer.name}</h4>
            <span className={`text-xs px-2 py-1 rounded-full ${
              customer.status === 'active' 
                ? 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
                : 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400'
            }`}>
              {customer.status}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {customer.phone}
            </div>
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {customer.email}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {customer.address}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-medium text-foreground">${customer.totalSpent}</div>
          <div className="text-sm text-muted-foreground">Last: {customer.lastVisit}</div>
        </div>
        
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
