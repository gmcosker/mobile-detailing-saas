'use client'

import { useState, useEffect } from 'react'
import { ErrorCard } from './ui/error-state'
import { LoadingState } from './ui/loading'

interface SafeSupabaseWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SafeSupabaseWrapper({ children, fallback }: SafeSupabaseWrapperProps) {
  const [hasSupabaseError, setHasSupabaseError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      setHasSupabaseError(true)
    }
    
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return <LoadingState message="Initializing..." />
  }

  if (hasSupabaseError) {
    return fallback || (
      <div className="p-4">
        <ErrorCard
          title="Database Configuration Required"
          message="This feature requires Supabase configuration. Please set up your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables to use photo management features."
        />
        
        <div className="mt-6 bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Demo Mode</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The photo management system is currently running in demo mode. To enable full functionality:
          </p>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a></li>
            <li>Copy your project URL and anon key</li>
            <li>Create a <code className="bg-muted px-2 py-1 rounded">.env.local</code> file with your credentials</li>
            <li>Run the SQL schema from <code className="bg-muted px-2 py-1 rounded">database/schema.sql</code></li>
            <li>Set up storage bucket for photos</li>
          </ol>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

