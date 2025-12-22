'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Mobile-only install prompt. Hidden on desktop and when already installed.
export default function InstallPrompt() {
  const [isDesktop, setIsDesktop] = useState(true) // Default to desktop to prevent flash
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return

    // STRICT desktop detection - never show on desktop
    const ua = navigator.userAgent.toLowerCase()
    const isDesktopOS = /windows|macintosh|linux/i.test(ua)
    const isMobileOS = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
    const isDesktopBrowser = !isMobileOS && (isDesktopOS || !/mobile|tablet/i.test(ua))
    
    // Also check screen size as additional safeguard
    const isLargeScreen = window.innerWidth >= 1024
    
    // If it's desktop OS/browser OR large screen, it's desktop - never show
    if (isDesktopBrowser || isLargeScreen) {
      setIsDesktop(true)
      return // Exit early, don't set up any listeners
    }
    
    setIsDesktop(false)

    const mobileMatch = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)

    // Already installed? do nothing
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true)
      return
    }

    const iOS = /iphone|ipad|ipod/i.test(ua)
    setIsIOS(iOS)

    if (iOS) {
      const hasSeen = localStorage.getItem('pwa-install-prompt-seen')
      if (!hasSeen) {
        const t = setTimeout(() => setShowPrompt(true), 2000)
        return () => clearTimeout(t)
      }
      return
    }

    // Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const hasSeen = localStorage.getItem('pwa-install-prompt-seen')
      if (!hasSeen) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      alert(
        'To install this app on your iOS device:\n\n' +
        '1. Tap the Share button (square with arrow)\n' +
        '2. Scroll down and tap "Add to Home Screen"\n' +
        '3. Tap "Add" in the top right'
      )
      localStorage.setItem('pwa-install-prompt-seen', 'true')
      setShowPrompt(false)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-install-prompt-seen', 'true')
      }
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-prompt-seen', 'true')
  }

  // Render guards - NEVER show on desktop
  if (isDesktop) return null
  if (isStandalone || !showPrompt) return null
  if (!isIOS && !deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm">Install DetailFlow</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add this app to your home screen for a better mobile experience.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="h-10 px-3 rounded-md border border-border text-sm text-foreground"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
