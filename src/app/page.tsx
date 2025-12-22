'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SelfHostedVideo from '@/components/home/SelfHostedVideo'

export default function HomePage() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalState, setModalState] = useState<'form' | 'success' | 'error'>('form')
  const [errorMessage, setErrorMessage] = useState('')
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

  const handleCTAClick = (e: React.MouseEvent, isHeroButton: boolean) => {
    if (isHeroButton) {
      e.preventDefault()
      setShowModal(true)
      setModalState('form')
      setEmail('')
      setErrorMessage('')
    }
    // Other buttons will navigate via Link
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setTimeout(() => {
      setModalState('form')
      setEmail('')
      setErrorMessage('')
    }, 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      // TODO: Integrate Firebase when config files are provided
      // For now, just show success message
      console.log('Email submitted:', email)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setModalState('success')
      setTimeout(() => {
        handleCloseModal()
      }, 2500)
    } catch (error: any) {
      console.error('Error submitting email:', error)
      setModalState('error')
      setErrorMessage('Could not save your email. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking auth (for PWA)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="py-4 px-6 md:px-12 fixed top-0 left-0 right-0 bg-gray-900 bg-opacity-80 backdrop-blur-md z-50">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">DetailFlow</h1>
          <Link 
            href="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors duration-300"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 text-center bg-gray-900">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
              The One App to Run Your Entire <br className="hidden md:block" />{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Mobile Detailing Business
              </span>
            </h2>
            <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-medium">
              Tired of chasing down clients, juggling calendars, and dealing with no-shows?
            </p>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              Your time is money. Our app handles the chaos of your business so you can focus on what you do best—making cars look incredible.
            </p>
            <button
              onClick={(e) => handleCTAClick(e, true)}
              className="mt-8 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
            >
              Receive Free Guide
            </button>
            <div className="mt-16 max-w-6xl mx-auto">
              <div className="relative rounded-2xl shadow-2xl border-4 border-gray-700 overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                {/* Self-hosted video player */}
                <div className="absolute top-0 left-0 w-full h-full">
                  <SelfHostedVideo 
                    videoSrc="/videos/DetailFlow (1).mp4"
                    className="w-full h-full"
                  />
                </div>
                {/* Overlay that covers the first 2 seconds - the "glass panel" that cuts off the start */}
                {/* This visually hides the first 2 seconds where YouTube UI appears, but video plays from beginning */}
                <div 
                  className="absolute top-0 left-0 right-0 z-30" 
                  style={{ 
                    height: '3.33%', // Covers approximately the first 2 seconds (adjust if needed)
                    background: 'transparent',
                    pointerEvents: 'auto',
                    userSelect: 'none',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    return false
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    return false
                  }}
                ></div>
                {/* Primary overlay - blocks all interaction for the entire video */}
                <div 
                  className="absolute inset-0 z-50" 
                  style={{ 
                    pointerEvents: 'auto',
                    background: 'transparent',
                    cursor: 'default',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onMouseMove={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onMouseOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                ></div>
                {/* Secondary overlay for extra protection */}
                <div 
                  className="absolute inset-0 z-40" 
                  style={{ 
                    pointerEvents: 'auto',
                    background: 'transparent',
                    mixBlendMode: 'normal'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32">
          <div className="mx-auto px-6 max-w-[2000px]">
            <div className="grid md:grid-cols-3 gap-16 text-center">
              {/* Feature 1: Stop Losing Money */}
              <div className="bg-gray-800 p-16 rounded-2xl border border-gray-700 shadow-lg">
                <div className="text-8xl mb-8">💰</div>
                <h3 className="text-4xl font-bold text-white mb-6">Stop Losing Money</h3>
                <p className="text-gray-400 text-xl leading-relaxed">
                  <strong>Automated Reminders & Secure Payments.</strong> Stop worrying about no-shows and awkward payment conversations. We send automated reminders to your clients and make it easy to get paid directly in the app.
                </p>
              </div>

              {/* Feature 2: Protect Your Business */}
              <div className="bg-gray-800 p-16 rounded-2xl border border-gray-700 shadow-lg">
                <div className="text-8xl mb-8">🛡️</div>
                <h3 className="text-4xl font-bold text-white mb-6">Protect Your Business</h3>
                <p className="text-gray-400 text-xl leading-relaxed">
                  <strong>Time-Stamped Before-and-After Photos.</strong> Never face another dispute over pre-existing damage. Our app lets you take time-stamped photos that are automatically saved to each client's file, giving you undeniable proof of your work.
                </p>
              </div>

              {/* Feature 3: Ditch the Paperwork */}
              <div className="bg-gray-800 p-16 rounded-2xl border border-gray-700 shadow-lg">
                <div className="text-8xl mb-8">📄</div>
                <h3 className="text-4xl font-bold text-white mb-6">Ditch the Paperwork</h3>
                <p className="text-gray-400 text-xl leading-relaxed">
                  <strong>Simple, Professional Booking.</strong> Get your own custom booking link that shows your real-time availability. Your clients can book and pay in one place, so you can throw away the spreadsheets and messy notes for good.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="cta" className="py-20 bg-gray-900">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Get Started in Minutes</h2>
            <p className="mt-4 text-lg text-gray-400">
              Start your free trial today. No credit card required. No complicated setup. <br />
              Get started today and reclaim your time.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-lg text-xl transition-transform transform hover:scale-105"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="container mx-auto px-6 text-center text-gray-500">
          <p>&copy; 2025 DetailFlow. All rights reserved.</p>
        </div>
      </footer>

      {/* Email Capture Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black bg-opacity-75"
            onClick={handleCloseModal}
          ></div>
          <div className="bg-gray-800 rounded-xl p-8 max-w-lg mx-auto z-10 relative shadow-2xl border border-gray-700">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors duration-200"
            >
              <span className="text-2xl font-bold">&times;</span>
            </button>

            {modalState === 'form' && (
              <>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Download Your Free Guide</h3>
                <p className="text-gray-400 mb-6 text-center">Enter your email to receive the guide instantly!</p>
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="p-3 rounded-lg bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your email address"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Me The Guide'}
                  </button>
                </form>
              </>
            )}

            {modalState === 'success' && (
              <>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Success!</h3>
                <p className="text-gray-400 mb-6 text-center">Your free guide has been sent to your inbox!</p>
              </>
            )}

            {modalState === 'error' && (
              <>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Error</h3>
                <p className="text-gray-400 mb-6 text-center">{errorMessage || 'An error occurred. Please try again later.'}</p>
                <button
                  onClick={() => setModalState('form')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors duration-200 w-full"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
