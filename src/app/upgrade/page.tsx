'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'

const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 17,
    description: 'Perfect for getting started',
    features: [
      'Up to 50 customers',
      'Unlimited appointments',
      'Basic SMS reminders',
      'Payment processing',
      'Photo management',
      'Email support'
    ],
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    description: 'Most popular for growing businesses',
    features: [
      'Unlimited customers',
      'Unlimited appointments',
      'Advanced SMS automation',
      'Payment processing',
      'Photo management',
      'Custom branding',
      'Priority support',
      'Analytics dashboard'
    ],
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 149,
    description: 'For established businesses',
    features: [
      'Everything in Professional',
      'Multi-user access',
      'API access',
      'White-label options',
      'Dedicated support',
      'Custom integrations'
    ],
    popular: false
  }
]

export default function UpgradePage() {
  const router = useRouter()
  const [detailerId, setDetailerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const fetchDetailerId = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user?.detailer_id) {
            setDetailerId(data.user.detailer_id)
          }
        }
      } catch (error) {
        console.error('Error fetching detailer ID:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetailerId()

    // Check for plan parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const planParam = urlParams.get('plan')
    if (planParam) {
      setSelectedPlan(planParam)
    }
  }, [router])

  const handleSelectPlan = async (planId: string) => {
    if (!detailerId) {
      alert('Please log in to upgrade')
      router.push('/login')
      return
    }

    setIsProcessing(true)
    setSelectedPlan(planId)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
          detailerId,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl
      } else {
        alert(data.error || 'Failed to create checkout session. Please try again.')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('An error occurred. Please try again.')
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Upgrade">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Upgrade Your Plan">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground">
            Select the plan that's right for your business. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border-2 rounded-lg p-8 ${
                plan.popular
                  ? 'border-primary bg-primary/5 scale-105'
                  : 'border-border bg-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan.id)}
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                disabled={isProcessing}
              >
                {isProcessing && selectedPlan === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Select ${plan.name}`
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>All plans include a 14-day free trial. Cancel anytime.</p>
          <p className="mt-2">
            Questions? <a href="mailto:support@detailflow.com" className="text-primary hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

