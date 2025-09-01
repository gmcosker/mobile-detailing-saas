import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <Loader2 
      className={cn(
        "animate-spin text-muted-foreground", 
        sizeClasses[size], 
        className
      )} 
    />
  )
}

interface LoadingStateProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingState({ 
  message = "Loading...", 
  size = "md", 
  className 
}: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-8", className)}>
      <LoadingSpinner size={size} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

interface LoadingCardProps {
  title?: string
  description?: string
  className?: string
}

export function LoadingCard({ 
  title = "Loading...", 
  description,
  className 
}: LoadingCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-lg p-6", className)}>
      <div className="flex items-center gap-3 mb-4">
        <LoadingSpinner size="sm" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      {/* Skeleton content */}
      <div className="space-y-3 mt-4">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  )
}

// Skeleton components for different UI elements
export function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}

// Button loading state
interface LoadingButtonProps {
  loading?: boolean
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export function LoadingButton({ 
  loading, 
  children, 
  className,
  onClick,
  disabled,
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2",
        className
      )}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  )
}

