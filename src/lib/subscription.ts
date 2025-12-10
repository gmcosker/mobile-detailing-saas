import { detailerService } from './database'
import { getSupabaseClient } from './supabase'

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'

export interface SubscriptionInfo {
  status: SubscriptionStatus
  daysLeft: number | null
  trialEndsAt: Date | null
  subscriptionEndsAt: Date | null
  subscriptionPlan: string | null
}

/**
 * Check subscription status for a detailer
 */
export async function checkSubscriptionStatus(detailerId: string): Promise<SubscriptionInfo> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return {
      status: 'expired',
      daysLeft: null,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      subscriptionPlan: null
    }
  }

  // Resolve detailer UUID if detailerId is a string (detailer_id)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(detailerId)
  let uuid = detailerId

  if (!isUuid) {
    const { data: detailer } = await supabase
      .from('detailers')
      .select('id')
      .eq('detailer_id', detailerId)
      .single()

    if (!detailer) {
      return {
        status: 'expired',
        daysLeft: null,
        trialEndsAt: null,
        subscriptionEndsAt: null,
        subscriptionPlan: null
      }
    }
    uuid = detailer.id
  }

  // Fetch detailer with subscription fields
  const { data: detailer, error } = await supabase
    .from('detailers')
    .select('subscription_status, trial_ends_at, subscription_ends_at, subscription_plan')
    .eq('id', uuid)
    .single()

  if (error || !detailer) {
    console.error('Error fetching subscription status:', error)
    return {
      status: 'expired',
      daysLeft: null,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      subscriptionPlan: null
    }
  }

  const status = (detailer.subscription_status as SubscriptionStatus) || 'expired'
  const trialEndsAt = detailer.trial_ends_at ? new Date(detailer.trial_ends_at) : null
  const subscriptionEndsAt = detailer.subscription_ends_at ? new Date(detailer.subscription_ends_at) : null
  const subscriptionPlan = detailer.subscription_plan || null

  // Calculate days left
  let daysLeft: number | null = null
  if (status === 'trial' && trialEndsAt) {
    daysLeft = getDaysRemaining(trialEndsAt)
    // Auto-update to expired if trial has ended
    if (daysLeft <= 0) {
      await detailerService.update(uuid, { subscription_status: 'expired' })
      return {
        status: 'expired',
        daysLeft: 0,
        trialEndsAt,
        subscriptionEndsAt: null,
        subscriptionPlan: null
      }
    }
  } else if (status === 'active' && subscriptionEndsAt) {
    daysLeft = getDaysRemaining(subscriptionEndsAt)
    // Auto-update to expired if subscription has ended
    if (daysLeft <= 0) {
      await detailerService.update(uuid, { subscription_status: 'expired' })
      return {
        status: 'expired',
        daysLeft: 0,
        trialEndsAt,
        subscriptionEndsAt,
        subscriptionPlan
      }
    }
  }

  return {
    status,
    daysLeft,
    trialEndsAt,
    subscriptionEndsAt,
    subscriptionPlan
  }
}

/**
 * Check if user has active access (trial or active subscription)
 */
export async function hasActiveAccess(detailerId: string): Promise<boolean> {
  const subscription = await checkSubscriptionStatus(detailerId)
  return subscription.status === 'trial' || subscription.status === 'active'
}

/**
 * Get days remaining in trial or subscription
 */
export function getDaysRemaining(endsAt: Date | string): number {
  const endDate = typeof endsAt === 'string' ? new Date(endsAt) : endsAt
  const now = new Date()
  const diffTime = endDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

