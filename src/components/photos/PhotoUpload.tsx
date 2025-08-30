'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { photoStorage, imageValidation } from '@/lib/storage'
import { photoService } from '@/lib/database'
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react'

interface PhotoUploadProps {
  appointmentId: string
  photoType: 'before' | 'after' | 'during'
  onUploadComplete?: (photoUrl: string) => void
  disabled?: boolean
}

export default function PhotoUpload({ 
  appointmentId, 
  photoType, 
  onUploadComplete,
  disabled = false 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    // Reset states
    setUploadStatus('idle')
    setErrorMessage('')
    setPreview(null)

    // Validate file
    if (!imageValidation.isValidImage(file)) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP)')
      setUploadStatus('error')
      return
    }

    if (!imageValidation.isValidSize(file, 10)) {
      setErrorMessage('File size must be less than 10MB')
      setUploadStatus('error')
      return
    }

    // Show preview
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    // Upload file
    setUploading(true)
    try {
      // Compress image before upload
      const compressedFile = await photoStorage.compressImage(file)
      
      // Upload to Supabase storage
      const photoUrl = await photoStorage.uploadPhoto(compressedFile, appointmentId, photoType)
      
      if (!photoUrl) {
        throw new Error('Failed to upload photo')
      }

      // Save to database
      const photoRecord = await photoService.create({
        appointment_id: appointmentId,
        file_path: photoUrl,
        file_name: file.name,
        photo_type: photoType,
        file_size: compressedFile.size,
        mime_type: compressedFile.type
      })

      if (!photoRecord) {
        throw new Error('Failed to save photo record')
      }

      setUploadStatus('success')
      onUploadComplete?.(photoUrl)
      
    } catch (error) {
      console.error('Upload error:', error)
      setErrorMessage('Failed to upload photo. Please try again.')
      setUploadStatus('error')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const clearPreview = () => {
    setPreview(null)
    setUploadStatus('idle')
    setErrorMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
      case 'error': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
      default: return 'text-muted-foreground bg-card border-border'
    }
  }

  const getTypeLabel = () => {
    switch (photoType) {
      case 'before': return 'Before Photo'
      case 'after': return 'After Photo'
      case 'during': return 'Progress Photo'
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-foreground">
        {getTypeLabel()}
      </div>

      {/* Upload Area */}
      <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${getStatusColor()}`}>
        {preview ? (
          // Preview State
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={preview} 
                alt={`${photoType} preview`}
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={clearPreview}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Upload successful!</span>
              </div>
            )}
            
            {uploadStatus === 'error' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Upload failed</span>
                </div>
                <p className="text-xs text-center">{errorMessage}</p>
                <Button 
                  onClick={clearPreview}
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Upload State
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Camera className="h-12 w-12 text-muted-foreground" />
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                Upload {getTypeLabel()}
              </h3>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, or WebP • Max 10MB
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              {/* Camera Capture (Mobile) */}
              <div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                  disabled={disabled || uploading}
                />
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={disabled || uploading}
                  size="sm"
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Camera
                </Button>
              </div>

              {/* File Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={disabled || uploading}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || uploading}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Gallery
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File Size Info */}
      <div className="text-xs text-muted-foreground text-center">
        Photos are automatically compressed for faster uploads
      </div>
    </div>
  )
}

