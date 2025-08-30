'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Users,
  Camera,
  DollarSign,
  MessageSquare,
  Menu,
  Bell,
  Settings
} from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
}

export default function DashboardLayout({ children, title = "Dashboard" }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden">
        <div className="grid grid-cols-5 gap-1 p-2">
          <NavButton icon={Calendar} label="Schedule" href="/" active />
          <NavButton icon={Users} label="Customers" href="/customers" />
          <NavButton icon={Camera} label="Photos" href="/photos" />
          <NavButton icon={DollarSign} label="Payments" href="/payments" />
          <NavButton icon={MessageSquare} label="SMS" href="/sms" />
        </div>
      </nav>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border">
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-8">
            Mobile Detailing
          </h2>
          
          <nav className="space-y-2">
            <SidebarButton icon={Calendar} label="Schedule" href="/" active />
            <SidebarButton icon={Users} label="Customers" href="/customers" />
            <SidebarButton icon={Camera} label="Photos" href="/photos" />
            <SidebarButton icon={DollarSign} label="Payments" href="/payments" />
            <SidebarButton icon={MessageSquare} label="SMS" href="/sms" />
          </nav>
        </div>
      </aside>

      {/* Desktop Main Content Offset */}
      <div className="hidden md:block md:ml-64" />
    </div>
  )
}

function NavButton({ 
  icon: Icon, 
  label, 
  href,
  active = false 
}: { 
  icon: any
  label: string
  href?: string
  active?: boolean 
}) {
  const Component = href ? 'a' : 'button'
  return (
    <Component 
      href={href}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </Component>
  )
}

function SidebarButton({ 
  icon: Icon, 
  label, 
  href,
  active = false 
}: { 
  icon: any
  label: string
  href?: string
  active?: boolean 
}) {
  const Component = href ? 'a' : 'button'
  return (
    <Component 
      href={href}
      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </Component>
  )
}
