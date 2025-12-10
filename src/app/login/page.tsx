'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          const data = await response.json()
          
          if (data.success && data.user) {
            // User is already logged in, redirect to dashboard
            router.replace('/dashboard')
            return
          } else {
            // Token invalid, clear it
            localStorage.removeItem('auth_token')
          }
        } catch (error) {
          // Error checking auth, clear token
          localStorage.removeItem('auth_token')
        }
      }
      
      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Invalid credentials')
        setIsLoading(false)
        return
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('auth_token', data.token)
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          business_name: businessName,
          contact_name: contactName,
          phone,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to create account')
        setIsLoading(false)
        return
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('auth_token', data.token)
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Signup error:', err)
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setBusinessName('')
    setContactName('')
    setPhone('')
    setError('')
  }

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            {isSignUp
              ? 'Create a new account to get started'
              : 'Enter your credentials to access your account'}
          </p>
        </div>

        <div className="flex gap-2 sm:gap-3 justify-center">
          <Button
            type="button"
            variant={!isSignUp ? 'default' : 'outline'}
            onClick={() => {
              setIsSignUp(false)
              resetForm()
            }}
            disabled={isLoading}
            className="h-12 sm:h-11 px-6 sm:px-4"
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={isSignUp ? 'default' : 'outline'}
            onClick={() => {
              setIsSignUp(true)
              resetForm()
            }}
            disabled={isLoading}
            className="h-12 sm:h-11 px-6 sm:px-4"
          >
            Create Account
          </Button>
        </div>

        {isSignUp ? (
          <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="business_name" className="text-sm sm:text-base">Business Name</Label>
              <Input
                id="business_name"
                type="text"
                placeholder="Premium Auto Detailing"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="organization"
                className="h-12 sm:h-11 text-base sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name" className="text-sm sm:text-base">Contact Name</Label>
              <Input
                id="contact_name"
                type="text"
                placeholder="John Smith"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="name"
                className="h-12 sm:h-11 text-base sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup_email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="signup_email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                className="h-12 sm:h-11 text-base sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup_phone" className="text-sm sm:text-base">Phone</Label>
              <Input
                id="signup_phone"
                type="tel"
                placeholder="555-0123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="tel"
                className="h-12 sm:h-11 text-base sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup_password" className="text-sm sm:text-base">Password</Label>
              <Input
                id="signup_password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                minLength={8}
                className="h-12 sm:h-11 text-base sm:text-sm"
              />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Password must be at least 8 characters
              </p>
            </div>

            {error && (
              <div className="text-sm sm:text-base text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 sm:p-4">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 sm:h-11"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                className="h-12 sm:h-11 text-base sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
                className="h-12 sm:h-11 text-base sm:text-sm"
              />
            </div>

            {error && (
              <div className="text-sm sm:text-base text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 sm:p-4">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 sm:h-11"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

