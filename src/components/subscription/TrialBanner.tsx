'use client'

import { useState, useEffect } from 'react'
import { Clock, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { checkSubscriptionStatus } from '@/lib/subscription'

interface TrialBannerProps {
  detailerId: string
  onDismiss?: () => void
}

export default function TrialBanner({ detailerId, onDismiss }: TrialBannerProps) {
  const [subscription, setSubscription] = useState<{
    status: string
    daysLeft: number | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        console.log('[TrialBanner] Fetching subscription for detailerId:', detailerId)
        const sub = await checkSubscriptionStatus(detailerId)
        console.log('[TrialBanner] Subscription status:', sub)
        setSubscription(sub)
      } catch (error) {
        console.error('[TrialBanner] Error fetching subscription:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (detailerId) {
      fetchSubscription()
    } else {
      console.warn('[TrialBanner] No detailerId provided')
      setIsLoading(false)
    }
  }, [detailerId])

  const handleDismiss = () => {
    setIsDismissed(true)
    if (onDismiss) {
      onDismiss()
    }
    // Store dismissal in localStorage (optional - can persist across sessions)
    localStorage.setItem(`trial-banner-dismissed-${detailerId}`, 'true')
  }

  // Check if user previously dismissed
  useEffect(() => {
    if (localStorage.getItem(`trial-banner-dismissed-${detailerId}`) === 'true') {
      setIsDismissed(true)
    }
  }, [detailerId])

  if (isLoading || isDismissed || !subscription) {
    return null
  }

  // Only show for trial status
  if (subscription.status !== 'trial') {
    return null
  }

  const daysLeft = subscription.daysLeft ?? 0

  if (daysLeft <= 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">
              {daysLeft === 1 
                ? '1 day left in your free trial'
                : `${daysLeft} days left in your free trial`
              }
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Upgrade now to continue using DetailFlow after your trial ends
            </p>
          </div>
        </div>

        <Link href="/upgrade">
          <Button size="sm" className="w-full sm:w-auto">
            Upgrade Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

