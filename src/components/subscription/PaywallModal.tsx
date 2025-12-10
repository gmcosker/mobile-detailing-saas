'use client'

import { useState, useEffect } from 'react'
import { X, Lock, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { checkSubscriptionStatus } from '@/lib/subscription'

interface PaywallModalProps {
  detailerId: string
  onClose?: () => void
}

const pricingPlans = [
  {
    name: 'Starter',
    price: 17,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter',
    features: [
      'Up to 50 customers',
      'Unlimited appointments',
      'Basic SMS reminders',
      'Payment processing',
      'Photo management',
      'Email support'
    ]
  },
  {
    name: 'Professional',
    price: 79,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
    recommended: true,
    features: [
      'Unlimited customers',
      'Unlimited appointments',
      'Advanced SMS automation',
      'Payment processing',
      'Photo management',
      'Custom branding',
      'Priority support',
      'Analytics dashboard'
    ]
  },
  {
    name: 'Business',
    price: 149,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || 'price_business',
    features: [
      'Everything in Professional',
      'Multi-user access',
      'API access',
      'White-label options',
      'Dedicated support',
      'Custom integrations'
    ]
  }
]

export default function PaywallModal({ detailerId, onClose }: PaywallModalProps) {
  const [subscription, setSubscription] = useState<{
    status: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const sub = await checkSubscriptionStatus(detailerId)
        setSubscription(sub)
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (detailerId) {
      fetchSubscription()
    }
  }, [detailerId])

  // Don't show if subscription is active
  if (!isLoading && subscription && subscription.status === 'active') {
    if (onClose) onClose()
    return null
  }

  const handleUpgrade = (planName: string) => {
    // Redirect to upgrade page with plan selection
    window.location.href = `/upgrade?plan=${planName.toLowerCase()}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 dark:bg-orange-900 rounded-full p-2">
              <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Your Trial Has Ended</h2>
              <p className="text-sm text-muted-foreground">Upgrade to continue using DetailFlow</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-8">
            <p className="text-muted-foreground">
              Choose a plan to unlock all features and continue managing your mobile detailing business.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative border-2 rounded-lg p-6 ${
                  plan.recommended
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan.name)}
                  className="w-full"
                  variant={plan.recommended ? 'default' : 'outline'}
                >
                  Select {plan.name}
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>All plans include a 14-day free trial. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

