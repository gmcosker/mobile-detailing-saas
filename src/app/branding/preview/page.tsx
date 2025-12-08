'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import BrandPreview from '@/components/branding/BrandPreview'
import { Loader2 } from 'lucide-react'

export default function BrandPreviewPage() {
  const [detailerId, setDetailerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetailerId = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          console.error('No auth token found')
          setLoading(false)
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user && data.user.detailer_id) {
            setDetailerId(data.user.detailer_id)
          }
        }
      } catch (error) {
        console.error('Error fetching detailer ID:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDetailerId()
  }, [])

  if (loading) {
    return (
      <DashboardLayout title="Brand Preview">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (!detailerId) {
    return (
      <DashboardLayout title="Brand Preview">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Unable to load brand preview. Please try logging in again.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Brand Preview">
      <BrandPreview detailerId={detailerId} />
    </DashboardLayout>
  )
}


