'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { serviceService } from '@/lib/database'
import { 
  X, 
  Tag, 
  DollarSign, 
  Clock, 
  FileText,
  AlertCircle
} from 'lucide-react'

interface Service {
  id?: string
  name: string
  description: string | null
  price: number
  duration: number
  is_active: boolean
  display_order: number
  category: string
}

interface ServiceFormProps {
  service?: Service | null
  onSave: (service: Service) => void
  onCancel: () => void
  isOpen: boolean
}

export default function ServiceForm({ service, onSave, onCancel, isOpen }: ServiceFormProps) {
  const [formData, setFormData] = useState<Service>({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    is_active: true,
    display_order: 0,
    category: 'General'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = ['General', 'Exterior', 'Interior', 'Complete', 'Packages', 'Add-ons']

  useEffect(() => {
    if (service) {
      setFormData(service)
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration: 30,
        is_active: true,
        display_order: 0,
        category: 'General'
      })
    }
    setError(null)
  }, [service, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Service name is required')
      return
    }
    
    if (formData.price <= 0) {
      setError('Price must be greater than $0')
      return
    }
    
    if (formData.duration <= 0) {
      setError('Duration must be greater than 0 minutes')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const serviceData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: Number(formData.price),
        duration: Number(formData.duration)
      }

      await onSave(serviceData)
    } catch (err) {
      console.error('Error in form submission:', err)
      setError('Failed to save service. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Service, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (error) setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {service ? 'Edit Service' : 'Add New Service'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Service Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Full Detail, Wash & Wax"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what's included in this service..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Price and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (min) *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                    placeholder="30"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Show this service to customers
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    {service ? 'Update Service' : 'Add Service'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
