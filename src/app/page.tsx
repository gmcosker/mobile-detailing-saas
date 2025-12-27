'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'

export default function HomePage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check if PWA and handle authentication redirect
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Check if running in PWA mode (standalone)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isPWA = isStandalone || (window.navigator as any).standalone === true

      if (isPWA) {
        // Check if user is logged in
        const token = localStorage.getItem('auth_token')
        
        if (token) {
          // Verify token is still valid
          try {
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            
            const data = await response.json()
            
            if (data.success && data.user) {
              // User is logged in, redirect to dashboard
              router.replace('/dashboard')
              return
            } else {
              // Token invalid, clear it and go to login
              localStorage.removeItem('auth_token')
              router.replace('/login')
              return
            }
          } catch (error) {
            // Error checking auth, go to login
            localStorage.removeItem('auth_token')
            router.replace('/login')
            return
          }
        } else {
          // No token, redirect to login
          router.replace('/login')
          return
        }
      }
      
      // Not PWA mode, show landing page
      setIsCheckingAuth(false)
    }

    checkAuthAndRedirect()
  }, [router])

  // Show loading state while checking auth (for PWA)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main>
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  )
}
