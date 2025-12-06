'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Users,
  Camera,
  DollarSign,
  MessageSquare,
  Menu,
  Bell,
  Settings,
  Tag,
  LogOut
} from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
}

export default function DashboardLayout({ children, title = "Dashboard" }: DashboardLayoutProps) {
  const router = useRouter()

  // Determine which page is active based on the title
  const getActivePage = () => {
    switch (title.toLowerCase()) {
      case 'dashboard':
      case 'schedule':
        return '/'
      case 'customers':
        return '/customers'
      case 'services':
        return '/services'
      case 'photos':
        return '/photos'
      case 'payments':
        return '/payments'
      case 'sms':
      case 'sms & reminders':
        return '/sms'
      case 'brand settings':
      case 'branding':
        return '/branding'
      default:
        return '/'
    }
  }

  const activePage = getActivePage()

  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Call logout API if token exists
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear token from localStorage
      localStorage.removeItem('auth_token')
      
      // Redirect to login page
      router.push('/login')
    }
  }

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
            <Button variant="ghost" size="icon" asChild>
              <a href="/branding">
                <Settings className="h-5 w-5" />
              </a>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-40 flex flex-col">
        <div className="p-6 flex-1">
          <h2 className="text-xl font-bold text-foreground mb-8">
            Mobile Detailing
          </h2>
          
          <nav className="space-y-2">
            <SidebarButton icon={Calendar} label="Schedule" href="/" active={activePage === '/'} />
            <SidebarButton icon={Users} label="Customers" href="/customers" active={activePage === '/customers'} />
            <SidebarButton icon={Tag} label="Services" href="/services" active={activePage === '/services'} />
            <SidebarButton icon={Camera} label="Photos" href="/photos" active={activePage === '/photos'} />
            <SidebarButton icon={DollarSign} label="Payments" href="/payments" active={activePage === '/payments'} />
            <SidebarButton icon={MessageSquare} label="SMS" href="/sms" active={activePage === '/sms'} />
            <SidebarButton icon={Settings} label="Brand Settings" href="/branding" active={activePage === '/branding'} />
          </nav>
        </div>
        
        <div className="p-6 border-t border-border">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content with proper offset */}
      <main className={`flex-1 ${title === "Dashboard" ? "md:ml-64" : "md:ml-64"}`}>
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          <NavButton icon={Calendar} label="Schedule" href="/" active={activePage === '/'} />
          <NavButton icon={Users} label="Customers" href="/customers" active={activePage === '/customers'} />
          <NavButton icon={Camera} label="Photos" href="/photos" active={activePage === '/photos'} />
          <NavButton icon={DollarSign} label="Payments" href="/payments" active={activePage === '/payments'} />
          <NavButton icon={MessageSquare} label="SMS" href="/sms" active={activePage === '/sms'} />
        </div>
      </nav>
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
