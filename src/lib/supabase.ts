import { createClient } from '@supabase/supabase-js'

// Safe Supabase client creation - completely lazy
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured')
    return null
  }
  
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

// Export null by default - client created on-demand only
export const supabase = null

// Types for our database tables
export type Database = {
  public: {
    Tables: {
      detailers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          business_name: string
          contact_name: string
          email: string
          phone: string
          detailer_id: string // unique identifier for booking links
          stripe_account_id: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          business_name: string
          contact_name: string
          email: string
          phone: string
          detailer_id: string
          stripe_account_id?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          business_name?: string
          contact_name?: string
          email?: string
          phone?: string
          detailer_id?: string
          stripe_account_id?: string | null
          is_active?: boolean
        }
      }
      customers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string | null
          phone: string
          address: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email?: string | null
          phone: string
          address?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string | null
          phone?: string
          address?: string | null
          notes?: string | null
        }
      }
      appointments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          detailer_id: string
          customer_id: string
          scheduled_date: string
          scheduled_time: string
          service_type: string
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          total_amount: number | null
          notes: string | null
          reminder_sent: boolean
          payment_status: 'pending' | 'paid' | 'failed' | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          detailer_id: string
          customer_id: string
          scheduled_date: string
          scheduled_time: string
          service_type: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          total_amount?: number | null
          notes?: string | null
          reminder_sent?: boolean
          payment_status?: 'pending' | 'paid' | 'failed' | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          detailer_id?: string
          customer_id?: string
          scheduled_date?: string
          scheduled_time?: string
          service_type?: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          total_amount?: number | null
          notes?: string | null
          reminder_sent?: boolean
          payment_status?: 'pending' | 'paid' | 'failed' | null
          stripe_payment_intent_id?: string | null
        }
      }
      photos: {
        Row: {
          id: string
          created_at: string
          appointment_id: string
          file_path: string
          file_name: string
          photo_type: 'before' | 'after' | 'during'
          file_size: number
          mime_type: string
        }
        Insert: {
          id?: string
          created_at?: string
          appointment_id: string
          file_path: string
          file_name: string
          photo_type: 'before' | 'after' | 'during'
          file_size: number
          mime_type: string
        }
        Update: {
          id?: string
          created_at?: string
          appointment_id?: string
          file_path?: string
          file_name?: string
          photo_type?: 'before' | 'after' | 'during'
          file_size?: number
          mime_type?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

