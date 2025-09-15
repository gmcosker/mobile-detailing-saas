'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface LogoUploadProps {
  onLogoUpload: (file: File) => void
  currentLogoUrl?: string
  isLoading?: boolean
}

export default function LogoUpload({ onLogoUpload, currentLogoUrl, isLoading }: LogoUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Call parent handler
    onLogoUpload(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const removeLogo = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Business Logo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your business logo to appear on customer booking pages
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        {preview ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Logo preview"
                className="max-h-32 max-w-full object-contain rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={removeLogo}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Click to change logo or drag a new one here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drag and drop your logo here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        )}
      </div>

      {/* File Requirements */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Supported formats: PNG, JPG, GIF, SVG</p>
        <p>• Maximum file size: 2MB</p>
        <p>• Recommended size: 200x100px or similar aspect ratio</p>
      </div>
    </div>
  )
}

