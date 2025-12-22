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
    uuid = (detailer as { id: string }).id
  }

  // Fetch detailer with subscription fields
  const { data: detailer, error } = await supabase
    .from('detailers')
    .select('id, subscription_status, trial_ends_at, subscription_ends_at, subscription_plan')
    .eq('id', uuid)
    .single()

  if (error || !detailer) {
    console.error('Error fetching subscription status:', error)
    // If columns don't exist, treat as expired (migration not run)
    if (error?.code === '42703' || error?.message?.includes('column')) {
      console.error('Subscription columns missing - migration not run!')
    }
    return {
      status: 'expired',
      daysLeft: null,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      subscriptionPlan: null
    }
  }

  // Type assertion for detailer data
  const detailerData = detailer as {
    id: string
    subscription_status: string | null
    trial_ends_at: string | null
    subscription_ends_at: string | null
    subscription_plan: string | null
  }

  const status = (detailerData.subscription_status as SubscriptionStatus) || null
  const trialEndsAt = detailerData.trial_ends_at ? new Date(detailerData.trial_ends_at) : null
  const subscriptionEndsAt = detailerData.subscription_ends_at ? new Date(detailerData.subscription_ends_at) : null
  const subscriptionPlan = detailerData.subscription_plan || null

  // Handle accounts created before migration (no trial dates but status is 'trial')
  // OR accounts with trial status but trial_ends_at is in the past
  if (status === 'trial') {
    if (!trialEndsAt) {
      // Account created before migration - no trial dates, expire it
      console.warn('Account has trial status but no trial_ends_at - created before migration, expiring now')
      await detailerService.update(uuid, { subscription_status: 'expired' })
      return {
        status: 'expired',
        daysLeft: 0,
        trialEndsAt: null,
        subscriptionEndsAt: null,
        subscriptionPlan: null
      }
    } else {
      // Check if trial has ended
      const daysLeft = getDaysRemaining(trialEndsAt)
      if (daysLeft <= 0) {
        // Trial has ended - update to expired
        await detailerService.update(uuid, { subscription_status: 'expired' })
        return {
          status: 'expired',
          daysLeft: 0,
          trialEndsAt,
          subscriptionEndsAt: null,
          subscriptionPlan: null
        }
      }
      // Trial still active
      return {
        status: 'trial',
        daysLeft,
        trialEndsAt,
        subscriptionEndsAt: null,
        subscriptionPlan: null
      }
    }
  }

  // Handle accounts with no status and no trial dates (created before migration)
  if (!status && !trialEndsAt) {
    console.warn('Account has no subscription status or trial dates - created before migration, marking as expired')
    await detailerService.update(uuid, { subscription_status: 'expired' })
    return {
      status: 'expired',
      daysLeft: null,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      subscriptionPlan: null
    }
  }

  // Calculate days left for active subscriptions
  let daysLeft: number | null = null
  if (status === 'active' && subscriptionEndsAt) {
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

