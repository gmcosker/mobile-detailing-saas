'use client'

import React from 'react'
import { ErrorState } from './ui/error-state'
import { Button } from './ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }
    
    // Call onError callback if provided
    this.props.onError?.(error, errorInfo)
    
    // In production, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props
      
      if (Fallback && this.state.error) {
        return <Fallback error={this.state.error} resetError={this.resetError} />
      }

      return (
        <ErrorState
          title="Something went wrong"
          message={
            process.env.NODE_ENV === 'development' && this.state.error
              ? this.state.error.message
              : "We encountered an unexpected error. Please try refreshing the page."
          }
          action={{
            label: "Try Again",
            onClick: this.resetError
          }}
          showHome={true}
        />
      )
    }

    return this.props.children
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Unhandled error:', error, errorInfo)
    
    // In production, send to error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }
}

// Higher-order component to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Specific error boundary for async operations
export function AsyncErrorBoundary({ 
  children, 
  onRetry 
}: { 
  children: React.ReactNode
  onRetry?: () => void 
}) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorState
          title="Failed to load content"
          message="There was an error loading this content. This might be due to a network issue or server error."
          action={{
            label: onRetry ? "Retry" : "Try Again",
            onClick: onRetry || resetError
          }}
          showRetry={true}
          onRetry={onRetry || resetError}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}


