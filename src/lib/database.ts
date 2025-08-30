import { getSupabaseClient } from './supabase'
import type { Database } from './supabase'

// Type helpers
type Tables = Database['public']['Tables']
type Detailer = Tables['detailers']['Row']
type Customer = Tables['customers']['Row']
type Appointment = Tables['appointments']['Row']
type Photo = Tables['photos']['Row']

// Detailer operations
export const detailerService = {
  async getByDetailerId(detailerId: string): Promise<Detailer | null> {
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
  }
}

// Photo operations
export const photoService = {
  async create(photo: Tables['photos']['Insert']): Promise<Photo | null> {
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

