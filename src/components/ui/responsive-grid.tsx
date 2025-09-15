import { cn } from "@/lib/utils"

interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  className 
}: ResponsiveGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2", 
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6"
  }
  
  const gapClass = `gap-${gap}`
  
  const responsiveClasses = [
    cols.default && gridCols[cols.default as keyof typeof gridCols],
    cols.sm && `sm:${gridCols[cols.sm as keyof typeof gridCols]}`,
    cols.md && `md:${gridCols[cols.md as keyof typeof gridCols]}`,
    cols.lg && `lg:${gridCols[cols.lg as keyof typeof gridCols]}`,
    cols.xl && `xl:${gridCols[cols.xl as keyof typeof gridCols]}`
  ].filter(Boolean).join(' ')
  
  return (
    <div className={cn("grid", responsiveClasses, gapClass, className)}>
      {children}
    </div>
  )
}

interface ResponsiveStackProps {
  children: React.ReactNode
  spacing?: number
  className?: string
}

export function ResponsiveStack({ 
  children, 
  spacing = 4, 
  className 
}: ResponsiveStackProps) {
  const spaceClass = `space-y-${spacing}`
  
  return (
    <div className={cn("flex flex-col", spaceClass, className)}>
      {children}
    </div>
  )
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function MobileMenu({ isOpen, onClose, children, title }: MobileMenuProps) {
  if (!isOpen) return null
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 md:hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          {title && (
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          {children}
        </div>
      </div>
    </>
  )
}

// Responsive container with proper padding
export function ResponsiveContainer({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  )
}

// Mobile-optimized card layout
export function MobileCard({ 
  children, 
  className,
  padding = "default"
}: { 
  children: React.ReactNode
  className?: string
  padding?: "sm" | "default" | "lg"
}) {
  const paddingClasses = {
    sm: "p-3",
    default: "p-4 sm:p-6", 
    lg: "p-6 sm:p-8"
  }
  
  return (
    <div className={cn(
      "bg-card border border-border rounded-lg",
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}

// Responsive text sizes
export function ResponsiveText({ 
  children, 
  size = "base",
  className 
}: { 
  children: React.ReactNode
  size?: "sm" | "base" | "lg" | "xl" | "2xl"
  className?: string
}) {
  const sizeClasses = {
    sm: "text-sm",
    base: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl", 
    xl: "text-xl sm:text-2xl",
    "2xl": "text-2xl sm:text-3xl"
  }
  
  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  )
}

// Mobile-friendly button group
export function MobileButtonGroup({ 
  children,
  orientation = "horizontal",
  className 
}: { 
  children: React.ReactNode
  orientation?: "horizontal" | "vertical"
  className?: string
}) {
  const orientationClass = orientation === "vertical" 
    ? "flex flex-col gap-2" 
    : "flex flex-col sm:flex-row gap-2"
  
  return (
    <div className={cn(orientationClass, className)}>
      {children}
    </div>
  )
}


