'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Check initial status
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    if (isOnline) {
      window.location.href = '/'
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-muted rounded-full">
            <WifiOff className="h-16 w-16 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            You're Offline
          </h1>
          <p className="text-muted-foreground">
            {isOnline 
              ? 'Connection restored! You can now continue using the app.'
              : 'No internet connection. Please check your network and try again.'}
          </p>
        </div>

        <Button
          onClick={handleRetry}
          className="w-full sm:w-auto h-12 sm:h-11"
          disabled={!isOnline}
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          {isOnline ? 'Continue' : 'Retry'}
        </Button>

        {!isOnline && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Some features require an internet connection. 
              Basic navigation may still work while offline.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

