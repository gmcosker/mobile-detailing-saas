'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'

const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 17,
    billingLabel: 'month',
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
    billingLabel: 'month',
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
    billingLabel: 'month',
    description: 'For established businesses',
    features: [
      'Everything in Professional',
      'Multi-user access for up to 5 profiles',
      'API access',
      'White-label options',
      'Dedicated support',
      'Custom integrations'
    ],
    popular: false
  },
  {
    id: 'lifetime',
    name: 'Lifetime Deal',
    price: 300,
    billingLabel: 'one-time',
    description: 'Everything in Professional with lifetime access (one payment).',
    features: [
      'Everything in Professional',
      'Lifetime access (no renewals)',
      'One-time payment'
    ],
    popular: true
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
          setIsLoading(false)
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

  const lifetimePlan = pricingPlans.find((p) => p.id === 'lifetime')!
  const mainPlans = pricingPlans.filter((p) => p.id !== 'lifetime')

  const pricingContent = (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground">
          Select the plan that's right for your business. All plans include a 14-day free trial.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-10">
        {mainPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSelect={handleSelectPlan}
            isProcessing={isProcessing && selectedPlan === plan.id}
          />
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-10">
        <div></div>
        <PlanCard
          plan={lifetimePlan}
          onSelect={handleSelectPlan}
          isProcessing={isProcessing && selectedPlan === lifetimePlan.id}
        />
        <div></div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include a 14-day free trial. Cancel anytime.</p>
        <p className="mt-2">
          Questions? <a href="mailto:support@detailflow.com" className="text-primary hover:underline">Contact support</a>
        </p>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // If user is logged in, use DashboardLayout, otherwise use simple public layout
  if (detailerId) {
    return (
      <DashboardLayout title="Upgrade Your Plan" skipPaywall={true}>
        {pricingContent}
      </DashboardLayout>
    )
  }

  // Public layout for non-logged-in users
  return (
    <div className="min-h-screen bg-background">
      <header className="py-4 px-6 md:px-12 border-b border-border">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">DetailFlow</h1>
          <Link 
            href="/login" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-5 rounded-lg transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </header>
      <main className="py-8">
        {pricingContent}
      </main>
    </div>
  )
}

function PlanCard({
  plan,
  onSelect,
  isProcessing,
}: {
  plan: typeof pricingPlans[number]
  onSelect: (planId: string) => void
  isProcessing: boolean
}) {
  return (
    <div
      className={`relative border-2 rounded-lg p-8 ${
        plan.popular ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border bg-card'
      }`}
    >

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-foreground">${plan.price}</span>
          <span className="text-muted-foreground">/{plan.billingLabel || 'month'}</span>
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
        onClick={() => onSelect(plan.id)}
        className="w-full"
        variant={plan.popular ? 'default' : 'outline'}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Select ${plan.name}`
        )}
      </Button>
    </div>
  )
}
