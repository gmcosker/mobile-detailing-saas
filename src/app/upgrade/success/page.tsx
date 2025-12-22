'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'

function UpgradeSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [detailerId, setDetailerId] = useState<string | null>(null)

  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId) {
        setStatus('error')
        return
      }

      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          setStatus('error')
          return
        }

        // Verify the checkout session
        const response = await fetch(`/api/subscriptions/verify-session?session_id=${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStatus('success')
            if (data.detailer_id) {
              setDetailerId(data.detailer_id)
            }
          } else {
            setStatus('error')
          }
        } else {
          setStatus('error')
        }
      } catch (error) {
        console.error('Error verifying session:', error)
        setStatus('error')
      }
    }

    verifySession()
  }, [sessionId])

  const content = (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {status === 'loading' && (
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Processing your payment...</h1>
          <p className="text-muted-foreground">Please wait while we confirm your subscription.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Payment Successful! 🎉</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your subscription has been activated. You now have full access to all features.
          </p>
          <div className="space-y-4">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <div>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/upgrade">View Subscription Details</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Payment Verification Failed</h1>
          <p className="text-lg text-muted-foreground mb-8">
            We couldn't verify your payment. If you were charged, please contact support.
          </p>
          <div className="space-y-4">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/upgrade">Try Again</Link>
            </Button>
            <div>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (detailerId) {
    return (
      <DashboardLayout title="Payment Success">
        {content}
      </DashboardLayout>
    )
  }

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
        {content}
      </main>
    </div>
  )
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <UpgradeSuccessContent />
    </Suspense>
  )
}

