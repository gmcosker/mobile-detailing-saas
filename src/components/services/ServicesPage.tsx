'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { serviceService } from '@/lib/database'
import ServiceForm from './ServiceForm'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  DollarSign,
  Clock,
  Tag,
  MoreVertical,
  Search,
  Filter
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  is_active: boolean
  display_order: number
  category: string
  created_at: string
  updated_at: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [detailerId, setDetailerId] = useState<string>('')

  useEffect(() => {
    fetchUserDetailerId()
  }, [])

  useEffect(() => {
    if (detailerId) {
      fetchServices()
    }
  }, [detailerId])

  const fetchUserDetailerId = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No auth token found')
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (data.success && data.user?.detailer_id) {
        setDetailerId(data.user.detailer_id)
        console.log('Loaded detailer_id for services:', data.user.detailer_id)
      } else {
        console.error('Failed to get detailer_id:', data.error)
      }
    } catch (error) {
      console.error('Error fetching user detailer_id:', error)
    }
  }

  const fetchServices = async () => {
    if (!detailerId) {
      console.log('No detailerId yet, skipping fetch')
      return
    }
    try {
      setLoading(true)
      const data = await serviceService.getAllByDetailerId(detailerId)
      setServices(data)
      console.log('Fetched services for detailer:', detailerId, 'Count:', data.length)
    } catch (error) {
      console.error('Error fetching services:', error)
      // If services table doesn't exist, start with empty array so UI still works
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (serviceId: string) => {
    try {
      const success = await serviceService.toggleActive(serviceId)
      if (success) {
        fetchServices() // Refresh the list
      }
    } catch (error) {
      console.error('Error toggling service:', error)
    }
  }

  const handleDelete = async (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        const success = await serviceService.delete(serviceId)
        if (success) {
          fetchServices() // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting service:', error)
      }
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setShowEditForm(true)
  }

  const handleSaveService = async (serviceData: Omit<Service, 'id'>) => {
    if (!detailerId) {
      alert('Unable to save service: Detailer ID not loaded. Please refresh the page.')
      return
    }
    try {
      if (editingService) {
        // Update existing service
        const updateData: Partial<Service> = {
          name: serviceData.name,
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
          is_active: serviceData.is_active,
          display_order: serviceData.display_order,
          category: serviceData.category
        }
        const updatedService = await serviceService.update(editingService.id, updateData)
        if (updatedService) {
          setShowEditForm(false)
          setEditingService(null)
          fetchServices()
        }
      } else {
        // Create new service - extract only the fields the database service expects
        const createData = {
          name: serviceData.name,
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
          is_active: serviceData.is_active,
          display_order: serviceData.display_order,
          category: serviceData.category
        }
        console.log('Creating service for detailer_id:', detailerId, createData)
        const newService = await serviceService.create(detailerId, createData)
        if (newService) {
          setShowAddForm(false)
          fetchServices()
        } else {
          // Show error message if service creation failed
          alert('Unable to create service. The services database table may not exist yet. Please check your database setup.')
        }
      }
    } catch (error) {
      console.error('Error saving service:', error)
    }
  }

  const handleCancelForm = () => {
    setShowAddForm(false)
    setShowEditForm(false)
    setEditingService(null)
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || service.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Service Management</h1>
        <p className="text-muted-foreground">Manage your service offerings and pricing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{services.length}</p>
              <p className="text-sm text-muted-foreground">Total Services</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
              <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {services.filter(s => s.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Services</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Service Button */}
            <Button
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`bg-card border rounded-lg p-4 transition-all hover:shadow-md ${
              service.is_active 
                ? 'border-border' 
                : 'border-border opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {service.name}
                </h3>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-400 rounded-full">
                  {service.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-lg transition-colors"
                  title="Edit service"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(service.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    service.is_active
                      ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-950'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                  title={service.is_active ? 'Hide from customers' : 'Show to customers'}
                >
                  {service.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Delete service"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {service.description && (
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {service.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-foreground">
                    ${service.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-muted-foreground">
                    {service.duration}min
                  </span>
                </div>
              </div>
              <button className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No services found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || filterCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first service'
            }
          </p>
          <Button
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Service
          </Button>
        </div>
      )}

      {/* Service Forms */}
      <ServiceForm
        service={null}
        onSave={handleSaveService}
        onCancel={handleCancelForm}
        isOpen={showAddForm}
      />
      
      <ServiceForm
        service={editingService}
        onSave={handleSaveService}
        onCancel={handleCancelForm}
        isOpen={showEditForm}
      />
    </div>
  )
}
