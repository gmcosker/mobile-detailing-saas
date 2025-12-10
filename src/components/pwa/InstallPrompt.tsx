'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  // IMMEDIATE desktop check - don't even set up state if desktop
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase()
    const isDesktopOS = /windows|macintosh|linux/i.test(userAgent) && !/android|iphone|ipad|ipod/i.test(userAgent)
    if (isDesktopOS) {
      return null // Don't render anything on desktop
    }
  }

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Double-check desktop (shouldn't reach here, but safety)
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : ''
    const isDesktopOS = /windows|macintosh|linux/i.test(userAgent) && !/android|iphone|ipad|ipod/i.test(userAgent)
    if (isDesktopOS) {
      return
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true)
      return
    }

    // Strict mobile device detection - only phones and tablets
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    
    // Only show on actual mobile devices
    if (!isMobileDevice) {
      console.log('[InstallPrompt] Not a mobile device, component disabled')
      return
    }
    
    setIsMobile(true)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // For iOS, show prompt immediately (no beforeinstallprompt event)
    if (iOS) {
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen')
      if (!hasSeenPrompt) {
        // Show after a short delay on iOS
        setTimeout(() => setShowPrompt(true), 2000)
      }
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay (don't be too aggressive)
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen')
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // iOS - show instructions
      if (isIOS) {
        alert(
          'To install this app on your iOS device:\n\n' +
          '1. Tap the Share button (square with arrow)\n' +
          '2. Scroll down and tap "Add to Home Screen"\n' +
          '3. Tap "Add" in the top right'
        )
      }
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
      localStorage.setItem('pwa-install-prompt-seen', 'true')
    } else {
      console.log('User dismissed the install prompt')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-prompt-seen', 'true')
  }

  // CRITICAL: Final desktop check before rendering anything
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase()
    const isDesktopOS = /windows|macintosh|linux/i.test(userAgent) && !/android|iphone|ipad|ipod/i.test(userAgent)
    if (isDesktopOS) {
      return null // Don't render anything on desktop
    }
  }

  // Don't show if already installed, not on mobile, or prompt not ready
  if (isStandalone || !isMobile || !showPrompt) {
    return null
  }

  // Show on iOS even without deferredPrompt, or on Android if deferredPrompt exists
  if (!isIOS && !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">
              Install DetailFlow
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isIOS 
                ? 'Add to your home screen for quick access'
                : 'Install this app for a better experience'}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleInstallClick}
            className="flex-1 h-10 text-sm"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            {isIOS ? 'Show Instructions' : 'Install'}
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="h-10 text-sm"
            size="sm"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  )
}

