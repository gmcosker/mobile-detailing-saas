'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Loader2, Eye, Star, ExternalLink } from 'lucide-react'
import LogoUpload from './LogoUpload'
import { brandingService } from '@/lib/database'
import { getSupabaseClient } from '@/lib/supabase'

interface BrandingSettingsProps {
  detailerId: string
}

export default function BrandingSettings({ detailerId }: BrandingSettingsProps) {
  const [branding, setBranding] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    loadBranding()
  }, [detailerId])

  const loadBranding = async () => {
    setLoading(true)
    try {
      const data = await brandingService.getByDetailerId(detailerId)
      if (data) {
        setBranding(data)
      } else {
        // Create default branding if none exists
        setBranding({
          primary_color: '#3B82F6',
          secondary_color: '#F3F4F6',
          text_color: '#1F2937',
          font_family: 'Inter',
          logo_position: 'header'
        })
      }
    } catch (error) {
      console.error('Error loading branding:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (file: File) => {
    setLogoFile(file)
    console.log('Logo file selected:', file.name)
    
    // Upload to Supabase storage
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error('Supabase not configured')
        return
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${detailerId}-${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      // Upload the file
      const { data, error } = await supabase.storage
        .from('photos') // Using the same bucket as photos for now
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error uploading logo:', error)
        alert('Failed to upload logo. Please try again.')
        return
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath)

      // Update the branding state with the new logo URL
      setBranding(prev => ({
        ...prev,
        logo_url: urlData.publicUrl
      }))

      console.log('Logo uploaded successfully:', urlData.publicUrl)
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Failed to upload logo. Please try again.')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Not authenticated. Please log in again.')
        setSaving(false)
        return
      }

      const brandingData: any = {
        primary_color: branding?.primary_color || '#3B82F6',
        secondary_color: branding?.secondary_color || '#F3F4F6',
        text_color: branding?.text_color || '#1F2937',
        font_family: branding?.font_family || 'Inter'
      }

      // Logo should already be uploaded and URL set in state
      if (branding?.logo_url) {
        brandingData.logo_url = branding.logo_url
      }

      console.log('Saving branding data:', brandingData)
      
      // Use API endpoint instead of direct database service
      const response = await fetch(`/api/branding/${detailerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(brandingData)
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        console.log('Branding saved successfully!', data.branding)
        alert('Branding settings saved!')
        // Update state with the returned branding data
        if (data.branding) {
          setBranding(data.branding)
        } else {
          // Reload if not returned
          await loadBranding()
        }
      } else {
        console.error('Failed to save branding:', data.error)
        alert(data.error || 'Failed to save branding settings')
      }
    } catch (error: any) {
      console.error('Error saving branding:', error)
      alert(`Error saving branding settings: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const updateBranding = (field: string, value: string) => {
    setBranding(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading branding settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Brand Settings</h2>
        <p className="text-muted-foreground">
          Customize how your business appears to customers
        </p>
      </div>

      <div className="grid gap-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Business Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <LogoUpload
              onLogoUpload={handleLogoUpload}
              currentLogoUrl={branding?.logo_url}
              isLoading={saving}
            />
          </CardContent>
        </Card>

        {/* Color Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="primary_color"
                    type="color"
                    value={branding?.primary_color || '#3B82F6'}
                    onChange={(e) => updateBranding('primary_color', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={branding?.primary_color || '#3B82F6'}
                    onChange={(e) => updateBranding('primary_color', e.target.value)}
                    className="flex-1"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={branding?.secondary_color || '#F3F4F6'}
                    onChange={(e) => updateBranding('secondary_color', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={branding?.secondary_color || '#F3F4F6'}
                    onChange={(e) => updateBranding('secondary_color', e.target.value)}
                    className="flex-1"
                    placeholder="#F3F4F6"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="text_color">Text Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="text_color"
                    type="color"
                    value={branding?.text_color || '#1F2937'}
                    onChange={(e) => updateBranding('text_color', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={branding?.text_color || '#1F2937'}
                    onChange={(e) => updateBranding('text_color', e.target.value)}
                    className="flex-1"
                    placeholder="#1F2937"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Font Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="font_family">Font Family</Label>
              <select
                id="font_family"
                value={branding?.font_family || 'Inter'}
                onChange={(e) => updateBranding('font_family', e.target.value)}
                className="w-full mt-1 p-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="Inter">Inter (Modern)</option>
                <option value="Roboto">Roboto (Clean)</option>
                <option value="Open Sans">Open Sans (Friendly)</option>
                <option value="Lato">Lato (Professional)</option>
                <option value="Poppins">Poppins (Bold)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Google Business Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Google Business Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="google_place_id">Google Place ID</Label>
              <Input
                id="google_place_id"
                value={branding?.google_place_id || ''}
                onChange={(e) => updateBranding('google_place_id', e.target.value)}
                placeholder="e.g., ChIJN1t_tDeuEmsRUsoyG83frY4"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Find your Place ID at{' '}
                <a 
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Google Places API
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="google_rating">Rating (0-5)</Label>
                <Input
                  id="google_rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={branding?.google_rating || ''}
                  onChange={(e) => updateBranding('google_rating', e.target.value)}
                  placeholder="4.9"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="google_review_count">Review Count</Label>
                <Input
                  id="google_review_count"
                  type="number"
                  min="0"
                  value={branding?.google_review_count || ''}
                  onChange={(e) => updateBranding('google_review_count', e.target.value)}
                  placeholder="127"
                  className="mt-1"
                />
              </div>
            </div>

            {branding?.google_rating && branding?.google_review_count && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const rating = parseFloat(branding.google_rating) || 0
                      const filled = star <= Math.round(rating)
                      return (
                        <Star 
                          key={star}
                          className={`h-4 w-4 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      )
                    })}
                  </div>
                  <span className="text-sm font-semibold">
                    {branding.google_rating} ({branding.google_review_count} reviews)
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> For now, you can manually enter your Google rating and review count. 
                In the future, we'll add automatic syncing with Google Places API.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <a href="/branding/preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview Brand
            </a>
          </Button>
          
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Brand Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
