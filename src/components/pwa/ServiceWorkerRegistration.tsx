'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Auto-unregister old service workers on /upgrade page to prevent caching issues
      const isUpgradePage = window.location.pathname === '/upgrade'
      
      if (isUpgradePage) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            // Unregister old service workers to force fresh load
            registration.unregister().then((success) => {
              if (success) {
                console.log('[Service Worker] Unregistered old worker to prevent caching')
                // Clear all caches
                if ('caches' in window) {
                  caches.keys().then((cacheNames) => {
                    cacheNames.forEach((cacheName) => {
                      caches.delete(cacheName)
                    })
                  })
                }
              }
            })
          })
        })
      }

      // Register service worker
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[Service Worker] Registered successfully:', registration.scope)

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available
                    console.log('[Service Worker] New version available')
                    // Optionally show update notification to user
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.log('[Service Worker] Registration failed:', error)
          })

        // Handle service worker updates
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true
            window.location.reload()
          }
        })
      })
    }
  }, [])

  return null
}

