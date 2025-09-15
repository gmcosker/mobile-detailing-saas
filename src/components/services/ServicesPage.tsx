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

  // For demo purposes, using hardcoded detailer ID
  const detailerId = '7eb3efd9-9676-41d8-bb93-57c484beeccb'

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const data = await serviceService.getAllByDetailerId(detailerId)
      setServices(data)
    } catch (error) {
      console.error('Error fetching services:', error)
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

  const handleSaveService = async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'detailer_id'>) => {
    try {
      if (editingService) {
        // Update existing service
        const updatedService = await serviceService.update(editingService.id, serviceData)
        if (updatedService) {
          setShowEditForm(false)
          setEditingService(null)
          fetchServices()
        }
      } else {
        // Create new service
        const newService = await serviceService.create(detailerId, serviceData)
        if (newService) {
          setShowAddForm(false)
          fetchServices()
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Management</h1>
          <p className="text-gray-600">Manage your service offerings and pricing</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                <p className="text-sm text-gray-600">Total Services</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {services.filter(s => s.is_active).length}
                </p>
                <p className="text-sm text-gray-600">Active Services</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ${services.reduce((sum, s) => sum + s.price, 0).toFixed(0)}
                </p>
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(services.reduce((sum, s) => sum + s.duration, 0) / 60)}h
                </p>
                <p className="text-sm text-gray-600">Total Duration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white/70 backdrop-blur-sm rounded-xl p-6 border transition-all hover:shadow-lg ${
                service.is_active 
                  ? 'border-white/20 hover:border-blue-200' 
                  : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {service.name}
                  </h3>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {service.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit service"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(service.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      service.is_active
                        ? 'text-green-600 hover:bg-green-100'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={service.is_active ? 'Hide from customers' : 'Show to customers'}
                  >
                    {service.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete service"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {service.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-gray-900">
                      ${service.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">
                      {service.duration}min
                    </span>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first service'
              }
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
    </div>
  )
}
