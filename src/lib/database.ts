import { getSupabaseClient } from './supabase'
import type { Database } from './supabase'

// Type helpers
type Tables = Database['public']['Tables']
type Detailer = Tables['detailers']['Row']
type Customer = Tables['customers']['Row']
type Appointment = Tables['appointments']['Row']
type Photo = Tables['photos']['Row']
type Service = Tables['services']['Row']

// Detailer operations
export const detailerService = {
  async getByDetailerId(detailerId: string): Promise<Detailer | null> {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('detailers')
      .select('*')
      .eq('detailer_id', detailerId)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('Error fetching detailer:', error)
      return null
    }
    
    return data
  },

  async create(detailer: Tables['detailers']['Insert']): Promise<Detailer | null> {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('detailers')
      .insert(detailer)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating detailer:', error)
      return null
    }
    
    return data
  }
}

// Customer operations
export const customerService = {
  async create(customer: Tables['customers']['Insert']): Promise<Customer | null> {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating customer:', error)
      return null
    }
    
    return data
  },

  async findByPhoneOrEmail(phone: string, email?: string): Promise<Customer | null> {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    let query = supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
    
    if (email) {
      query = query.or(`email.eq.${email}`)
    }
    
    const { data, error } = await query.maybeSingle()
    
    if (error) {
      console.error('Error finding customer:', error)
      return null
    }
    
    return data
  }
}

// Appointment operations
export const appointmentService = {
  async create(appointment: Tables['appointments']['Insert']): Promise<Appointment | null> {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating appointment:', error)
      return null
    }
    
    return data
  },

  async getByDetailer(detailerId: string, limit: number = 50): Promise<Appointment[]> {
    const supabase = getSupabaseClient()
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        customers (*)
      `)
      .eq('detailer_id', detailerId)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching appointments:', error)
      return []
    }
    
    return data || []
  },

  async updateStatus(appointmentId: string, status: Appointment['status']): Promise<boolean> {
    const supabase = getSupabaseClient()
    if (!supabase) return false
    
    const { error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appointmentId)
    
    if (error) {
      console.error('Error updating appointment status:', error)
      return false
    }
    
    return true
  },

  async getUpcomingForReminders(): Promise<Appointment[]> {
    const supabase = getSupabaseClient()
    if (!supabase) return []
    
    // Get appointments scheduled for tomorrow that haven't had reminders sent
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        customers (*),
        detailers (*)
      `)
      .eq('scheduled_date', tomorrowStr)
      .eq('reminder_sent', false)
      .in('status', ['pending', 'confirmed'])
    
    if (error) {
      console.error('Error fetching appointments for reminders:', error)
      return []
    }
    
    return data || []
  },

  async getBookedSlots(detailerId: string, startDate: string, endDate: string): Promise<{date: string, time: string}[]> {
    const supabase = getSupabaseClient()
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('appointments')
      .select('scheduled_date, scheduled_time')
      .eq('detailer_id', detailerId)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .in('status', ['pending', 'confirmed', 'in_progress'])
    
    if (error) {
      console.error('Error fetching booked slots:', error)
      return []
    }
    
    return data?.map(apt => ({
      date: apt.scheduled_date,
      time: apt.scheduled_time
    })) || []
  }
}

// Branding operations
export const brandingService = {
  async getByDetailerId(detailerId: string): Promise<any | null> {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    // First get the detailer's UUID
    const { data: detailer, error: detailerError } = await supabase
      .from('detailers')
      .select('id')
      .eq('detailer_id', detailerId)
      .single()
    
    if (detailerError || !detailer) {
      console.error('Error finding detailer:', detailerError)
      return null
    }
    
    const { data, error } = await supabase
      .from('branding')
      .select('*')
      .eq('detailer_id', detailer.id)
      .single()
    
    if (error) {
      console.error('Error fetching branding:', error)
      return null
    }
    
    return data
  },

  async update(detailerId: string, branding: any): Promise<boolean> {
    const supabase = getSupabaseClient()
    if (!supabase) return false
    
    // First get the detailer's UUID
    const { data: detailer, error: detailerError } = await supabase
      .from('detailers')
      .select('id')
      .eq('detailer_id', detailerId)
      .single()
    
    if (detailerError || !detailer) {
      console.error('Error finding detailer:', detailerError)
      return false
    }
    
    const { error } = await supabase
      .from('branding')
      .update(branding)
      .eq('detailer_id', detailer.id)
    
    if (error) {
      console.error('Error updating branding:', error)
      return false
    }
    
    return true
  },

  async create(detailerId: string, branding: any): Promise<boolean> {
    const supabase = getSupabaseClient()
    if (!supabase) return false
    
    const { error } = await supabase
      .from('branding')
      .insert({
        detailer_id: detailerId,
        ...branding
      })
    
    if (error) {
      console.error('Error creating branding:', error)
      return false
    }
    
    return true
  }
}

// Photo operations
export const photoService = {
  async create(photo: Tables['photos']['Insert']): Promise<Photo | null> {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('photos')
      .insert(photo)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating photo record:', error)
      return null
    }
    
    return data
  },

  async getByAppointment(appointmentId: string): Promise<Photo[]> {
    const supabase = getSupabaseClient()
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching photos:', error)
      return []
    }
    
    return data || []
  },

  async delete(photoId: string): Promise<boolean> {
    const supabase = getSupabaseClient()
    if (!supabase) return false
    
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)
    
    if (error) {
      console.error('Error deleting photo:', error)
      return false
    }
    
    return true
  }
}

// Utility functions
export const generateDetailerId = (businessName: string): string => {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 30) // Limit length
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatTime = (time: string): string => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Services operations
export const serviceService = {
  // Get all services for a detailer
  async getByDetailerId(detailerId: string): Promise<Service[]> {
    const supabase = getSupabaseClient()
    if (!supabase) return []
    
    let detailerUuid = detailerId
    
    // Check if detailerId is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(detailerId)
    
    if (!isUuid) {
      // detailerId is a string identifier, need to look up the UUID
      const { data: detailer, error: detailerError } = await supabase
        .from('detailers')
        .select('id')
        .eq('detailer_id', detailerId)
        .single()
      
      if (detailerError || !detailer) {
        console.error('Error finding detailer:', detailerError)
        return []
      }
      
      detailerUuid = detailer.id
    }
    
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('detailer_id', detailerUuid)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching services:', error)
      return []
    }
    
    return data || []
  },

  // Get all services (including inactive) for management
  async getAllByDetailerId(detailerId: string): Promise<Service[]> {
    const supabase = getSupabaseClient()
    if (!supabase) return []
    
    let detailerUuid = detailerId
    
    // Check if detailerId is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(detailerId)
    
    if (!isUuid) {
      // detailerId is a string identifier, need to look up the UUID
      const { data: detailer, error: detailerError } = await supabase
        .from('detailers')
        .select('id')
        .eq('detailer_id', detailerId)
        .single()
      
      if (detailerError || !detailer) {
        console.error('Error finding detailer:', detailerError)
        return []
      }
      
      detailerUuid = detailer.id
    }
    
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('detailer_id', detailerUuid)
      .order('display_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching services:', error)
      return []
    }
    
    return data || []
  },

  // Create a new service
  async create(detailerId: string, service: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'detailer_id'>): Promise<Service | null> {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    let detailerUuid = detailerId
    
    // Check if detailerId is a UUID (starts with 8-4-4-4-12 pattern)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(detailerId)
    
    if (!isUuid) {
      // detailerId is a string identifier, need to look up the UUID
      const { data: detailer, error: detailerError } = await supabase
        .from('detailers')
        .select('id')
        .eq('detailer_id', detailerId)
        .single()
      
      if (detailerError || !detailer) {
        console.error('Error finding detailer:', detailerError)
        return null
      }
      
      detailerUuid = detailer.id
    }
    
    const { data, error } = await supabase
      .from('services')
      .insert({
        ...service,
        detailer_id: detailerUuid
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating service:', error)
      return null
    }
    
    return data
  },

  // Update a service
  async update(serviceId: string, updates: Partial<Service>): Promise<Service | null> {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating service:', error)
      return null
    }
    
    return data
  },

  // Delete a service
  async delete(serviceId: string): Promise<boolean> {
    const supabase = getSupabaseClient()
    if (!supabase) return false
    
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
    
    if (error) {
      console.error('Error deleting service:', error)
      return false
    }
    
    return true
  },

  // Toggle service active status
  async toggleActive(serviceId: string): Promise<boolean> {
    const supabase = getSupabaseClient()
    if (!supabase) return false
    
    // First get current status
    const { data: service, error: fetchError } = await supabase
      .from('services')
      .select('is_active')
      .eq('id', serviceId)
      .single()
    
    if (fetchError || !service) {
      console.error('Error fetching service:', fetchError)
      return false
    }
    
    const { error } = await supabase
      .from('services')
      .update({ is_active: !service.is_active })
      .eq('id', serviceId)
    
    if (error) {
      console.error('Error toggling service status:', error)
      return false
    }
    
    return true
  }
}

