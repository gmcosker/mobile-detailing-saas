'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, ExternalLink, Loader2 } from 'lucide-react'
import { brandingService, detailerService } from '@/lib/database'

interface BrandPreviewProps {
  detailerId: string
}

export default function BrandPreview({ detailerId }: BrandPreviewProps) {
  const [branding, setBranding] = useState<any>(null)
  const [detailer, setDetailer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [brandingData, detailerData] = await Promise.all([
          brandingService.getByDetailerId(detailerId),
          detailerService.getByDetailerId(detailerId)
        ])
        
        setBranding(brandingData)
        setDetailer(detailerData)
      } catch (error) {
        console.error('Error loading preview data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [detailerId])

  const getCustomStyles = () => {
    if (!branding) return {}
    
    return {
      '--primary-color': branding.primary_color || '#3B82F6',
      '--secondary-color': branding.secondary_color || '#F3F4F6',
      '--text-color': branding.text_color || '#1F2937',
      '--font-family': branding.font_family || 'Inter'
    } as React.CSSProperties
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading brand preview...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Brand Preview</h2>
        <p className="text-muted-foreground">
          See how your branding will appear to customers
        </p>
      </div>

      {/* Preview Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button asChild>
              <a href="/branding" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Edit Brand Settings
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`/book/${detailerId}`} target="_blank" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Customer View
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Booking Page Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Booking Experience</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-lg overflow-hidden"
            style={getCustomStyles()}
          >
            {/* Mobile Preview Container */}
            <div className="max-w-sm mx-auto bg-background">
              {/* Header Preview */}
              <header className="bg-card border-b border-border px-4 py-4">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {branding?.logo_url && (
                          <img
                            src={branding.logo_url}
                            alt="Business Logo"
                            className="h-8 w-auto object-contain"
                          />
                        )}
                        <h1 
                          className="text-xl font-bold text-foreground"
                          style={{ 
                            color: branding?.text_color || undefined,
                            fontFamily: branding?.font_family || undefined
                          }}
                        >
                          {detailer?.business_name || 'Auto Detailing Service'}
                        </h1>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className="h-4 w-4 fill-yellow-400 text-yellow-400">⭐</div>
                          <span>4.9</span>
                          <span>(127 reviews)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* Progress Steps Preview */}
              <div className="bg-card border-b border-border px-4 py-3">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center justify-between">
                    {[1, 2, 3, 4].map((stepNum) => (
                      <div key={stepNum} className="flex items-center">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            stepNum === 1 ? 'text-white' : 'bg-muted text-muted-foreground'
                          }`}
                          style={{
                            backgroundColor: stepNum === 1 
                              ? (branding?.primary_color || '#3B82F6')
                              : undefined
                          }}
                        >
                          {stepNum}
                        </div>
                        {stepNum < 4 && (
                          <div className={`w-8 h-0.5 ${stepNum === 1 ? 'bg-green-500' : 'bg-muted'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Service</span>
                    <span>Date & Time</span>
                    <span>Details</span>
                    <span>Confirm</span>
                  </div>
                </div>
              </div>

              {/* Service Selection Preview */}
              <main className="p-4">
                <div className="space-y-4">
                  <h2 
                    className="text-lg font-semibold text-foreground"
                    style={{ fontFamily: branding?.font_family || undefined }}
                  >
                    Choose Your Service
                  </h2>
                  
                  {/* Sample Service Button */}
                  <button
                    className="w-full p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors text-left"
                    style={{
                      borderColor: 'var(--primary-color, #3B82F6)',
                      fontFamily: branding?.font_family || undefined
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ 
                            backgroundColor: `${branding?.primary_color || '#3B82F6'}20`,
                            color: branding?.primary_color || '#3B82F6'
                          }}
                        >
                          🚗
                        </div>
                        <div>
                          <div className="font-medium text-foreground">Full Detail</div>
                          <div className="text-sm text-muted-foreground">180 minutes</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">$150</div>
                      </div>
                    </div>
                  </button>

                  {/* Sample Action Button */}
                  <Button 
                    className="w-full"
                    style={{
                      backgroundColor: branding?.primary_color || '#3B82F6',
                      fontFamily: branding?.font_family || undefined
                    }}
                  >
                    Continue to Details
                  </Button>
                </div>
              </main>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Brand Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Colors</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: branding?.primary_color || '#3B82F6' }}
                  />
                  <span className="text-sm">Primary: {branding?.primary_color || '#3B82F6'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: branding?.secondary_color || '#F3F4F6' }}
                  />
                  <span className="text-sm">Secondary: {branding?.secondary_color || '#F3F4F6'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: branding?.text_color || '#1F2937' }}
                  />
                  <span className="text-sm">Text: {branding?.text_color || '#1F2937'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">Typography</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Font Family:</span> {branding?.font_family || 'Inter'}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Logo:</span> {branding?.logo_url ? '✅ Uploaded' : '❌ Not uploaded'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



