'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { photoService } from '@/lib/database'

export default function DebugPage() {
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testPhotoLoading = async () => {
      try {
        console.log('🔍 Testing photo loading...')
        
        // Test Supabase client
        const supabase = getSupabaseClient()
        console.log('Supabase client:', supabase ? '✅ Available' : '❌ Not available')
        
        if (!supabase) {
          setError('Supabase client not available')
          return
        }
        
        // Test photo loading for the appointment
        const appointmentId = '4641adf0-4257-424b-b4b4-2b043b797d00'
        console.log('Loading photos for appointment:', appointmentId)
        
        const fetchedPhotos = await photoService.getByAppointment(appointmentId)
        console.log('Fetched photos:', fetchedPhotos)
        setPhotos(fetchedPhotos)
        
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    testPhotoLoading()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
        <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
        <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Photos ({photos.length})</h2>
        {photos.map((photo, index) => (
          <div key={photo.id} className="border p-4 mb-2 rounded">
            <p><strong>Photo {index + 1}:</strong></p>
            <p>ID: {photo.id}</p>
            <p>Type: {photo.photo_type}</p>
            <p>File Path: {photo.file_path}</p>
            <p>Size: {photo.file_size} bytes</p>
            <p>Created: {new Date(photo.created_at).toLocaleString()}</p>
            
            {/* Test image display */}
            <div className="mt-2">
              <p>Image Preview:</p>
              <img 
                src={photo.file_path.startsWith('http') ? photo.file_path : `https://lscyikmlhotczdxelkby.supabase.co/storage/v1/object/public/photos/${photo.file_path}`}
                alt={`${photo.photo_type} photo`}
                className="w-32 h-32 object-cover border rounded"
                onError={(e) => {
                  console.error('Image load error:', e)
                  e.currentTarget.style.display = 'none'
                }}
                onLoad={() => console.log('Image loaded successfully')}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

