import { cn } from "@/lib/utils"
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react"
import { Button } from "./button"
import Link from "next/link"

interface ErrorStateProps {
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  showRetry?: boolean
  onRetry?: () => void
  showHome?: boolean
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an error while loading this content.",
  action,
  showRetry = true,
  onRetry,
  showHome = false,
  className
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 p-8 text-center", className)}>
      <div className="rounded-full bg-red-50 dark:bg-red-950 p-3">
        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>
      
      <div className="flex items-center gap-3">
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        
        {showHome && (
          <Button asChild variant="outline">
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

interface ErrorCardProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorCard({
  title = "Failed to load",
  message = "There was an error loading this content.",
  onRetry,
  className
}: ErrorCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-lg p-6", className)}>
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-red-50 dark:bg-red-950 p-2">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="flex-1 space-y-2">
          <h4 className="font-medium text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground">{message}</p>
          
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="gap-2 mt-3">
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Network error specifically
export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      showRetry={true}
      onRetry={onRetry}
    />
  )
}

// 404 error state
export function NotFoundState({ 
  title = "Page Not Found",
  message = "The page you're looking for doesn't exist or has been moved.",
  showHome = true 
}: {
  title?: string
  message?: string
  showHome?: boolean
}) {
  return (
    <ErrorState
      title={title}
      message={message}
      showHome={showHome}
      showRetry={false}
    />
  )
}

// Empty state (not really an error, but similar UI)
export function EmptyState({
  title = "No data found",
  message = "There's nothing here yet.",
  action,
  icon: Icon = AlertTriangle,
  className
}: {
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ComponentType<any>
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 p-8 text-center", className)}>
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>
      
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
