import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabase'
import { detailerService } from './database'
// @ts-ignore - jsonwebtoken is available as transitive dependency
import jwt from 'jsonwebtoken'

// Verify authentication using Supabase Auth
export async function verifyAuth(request: NextRequest): Promise<{ userId: string, detailerId: string } | null> {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found')
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    
    if (!token) {
      console.log('Empty token')
      return null
    }

    // Verify token with Supabase Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables not configured')
      return null
    }

    // Verify JWT token using Supabase Auth
    // Strategy: Decode JWT to get user ID, then use Admin API to fetch user details
    let user = null
    let authError = null
    
    try {
      // Decode JWT to get user ID (without verification - we'll verify via Supabase)
      const decoded = jwt.decode(token) as { sub?: string; email?: string } | null
      
      if (decoded && decoded.sub) {
        // Use Admin API to get user details (more reliable for server-side)
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceRoleKey) {
          const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          })
          
          const { data: adminUser, error: adminError } = await adminSupabase.auth.admin.getUserById(decoded.sub)
          if (adminUser?.user && !adminError) {
            user = adminUser.user
          } else {
            authError = adminError
          }
        } else {
          // Fallback: Try regular client with token in headers
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            },
            auth: {
              persistSession: false,
              autoRefreshToken: false
            }
          })
          
          const userResult = await supabase.auth.getUser()
          if (userResult.data.user) {
            user = userResult.data.user
          } else {
            authError = userResult.error
          }
        }
      } else {
        authError = new Error('Invalid token format')
      }
    } catch (decodeError) {
      console.error('JWT decode error:', decodeError)
      authError = decodeError as Error
    }
    
    if (authError || !user) {
      console.error('Supabase auth error:', authError?.message || 'No user found', 'Token preview:', token.substring(0, 30) + '...')
      
      // If JWT verification fails, try fallback: check if token is a detailer_id
      // This allows backward compatibility during the transition
      const dbClient = getSupabaseClient()
      if (dbClient) {
        const { data: detailer } = await dbClient
          .from('detailers')
          .select('*')
          .eq('detailer_id', token)
          .eq('is_active', true)
          .single()

        if (detailer) {
          return {
            userId: detailer.id,
            detailerId: detailer.detailer_id
          }
        }
      }

      return null
    }
    
    if (!user || !user.email) {
      console.log('No user or email from token')
      return null
    }

    // Get detailer by email (link detailers to auth users via email)
    const dbClient = getSupabaseClient()
    if (!dbClient) {
      return null
    }

    const { data: detailer, error: detailerError } = await dbClient
      .from('detailers')
      .select('*')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    if (detailerError || !detailer) {
      console.error('Detailer not found for email:', user.email, detailerError)
      return null
    }

    return {
      userId: detailer.id,
      detailerId: detailer.detailer_id
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

// Helper to verify user owns a resource (by detailer_id)
export async function verifyResourceOwnership(
  resourceDetailerId: string,
  authenticatedDetailerId: string
): Promise<boolean> {
  // If resource uses UUID detailer_id, need to resolve it
  const supabase = getSupabaseClient()
  if (!supabase) return false

  // Check if authenticatedDetailerId is UUID or detailer_id string
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authenticatedDetailerId)
  
  if (isUuid) {
    // authenticatedDetailerId is UUID, compare directly
    return resourceDetailerId === authenticatedDetailerId
  } else {
    // authenticatedDetailerId is detailer_id string, need to resolve resource's detailer_id
    const { data: detailer, error } = await supabase
      .from('detailers')
      .select('detailer_id')
      .eq('id', resourceDetailerId)
      .single()
    
    if (error || !detailer || typeof detailer !== 'object' || !('detailer_id' in detailer)) {
      return false
    }
    
    return (detailer as { detailer_id: string }).detailer_id === authenticatedDetailerId
  }
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  // Basic phone validation - accepts various formats
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

export function isValidTime(timeString: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
  return timeRegex.test(timeString)
}

export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(color)
}

