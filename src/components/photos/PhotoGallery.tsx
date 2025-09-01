'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { photoService } from '@/lib/database'
import type { Database } from '@/lib/supabase'
import { 
  Camera, 
  Trash2, 
  Download, 
  ZoomIn, 
  X,
  Calendar,
  Clock
} from 'lucide-react'

type Photo = Database['public']['Tables']['photos']['Row']

interface PhotoGalleryProps {
  appointmentId?: string
  detailerId?: string
  showUploadButton?: boolean
  maxPhotos?: number
  onPhotoDelete?: (photoId: string) => void
}

export default function PhotoGallery({ 
  appointmentId, 
  detailerId, 
  showUploadButton = false,
  maxPhotos,
  onPhotoDelete 
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadPhotos()
  }, [appointmentId])

  const loadPhotos = async () => {
    if (!appointmentId) return
    
    setLoading(true)
    try {
      const fetchedPhotos = await photoService.getByAppointment(appointmentId)
      setPhotos(fetchedPhotos)
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePhoto = async (photo: Photo) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      const success = await photoService.delete(photo.id)
      if (success) {
        setPhotos(photos.filter(p => p.id !== photo.id))
        onPhotoDelete?.(photo.id)
        setShowModal(false)
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
    }
  }

  const handleDownloadPhoto = (photo: Photo) => {
    const link = document.createElement('a')
    link.href = photo.file_path
    link.download = photo.file_name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openModal = (photo: Photo) => {
    setSelectedPhoto(photo)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedPhoto(null)
  }

  const getPhotosByType = (type: 'before' | 'after' | 'during') => {
    return photos.filter(photo => photo.photo_type === type)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-card rounded-lg border border-border">
        <div className="text-center space-y-2">
          <Camera className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading photos...</p>
        </div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Photos Yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload before and after photos to document your work
        </p>
        {showUploadButton && (
          <Button className="gap-2">
            <Camera className="h-4 w-4" />
            Add Photos
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Before/After Comparison */}
      {getPhotosByType('before').length > 0 && getPhotosByType('after').length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Before & After</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Before</h4>
              <div className="grid gap-2">
                {getPhotosByType('before').slice(0, 2).map((photo) => (
                  <div key={photo.id} className="relative group cursor-pointer" onClick={() => openModal(photo)}>
                    <img
                      src={photo.file_path}
                      alt="Before photo"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">After</h4>
              <div className="grid gap-2">
                {getPhotosByType('after').slice(0, 2).map((photo) => (
                  <div key={photo.id} className="relative group cursor-pointer" onClick={() => openModal(photo)}>
                    <img
                      src={photo.file_path}
                      alt="After photo"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Photos Grid */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            All Photos ({photos.length})
          </h3>
          {showUploadButton && (
            <Button size="sm" className="gap-2">
              <Camera className="h-4 w-4" />
              Add More
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(maxPhotos ? photos.slice(0, maxPhotos) : photos).map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="relative cursor-pointer" onClick={() => openModal(photo)}>
                <img
                  src={photo.file_path}
                  alt={`${photo.photo_type} photo`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <ZoomIn className="h-6 w-6 text-white" />
                </div>
                <div className="absolute top-2 left-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    photo.photo_type === 'before' 
                      ? 'bg-blue-500 text-white' 
                      : photo.photo_type === 'after'
                      ? 'bg-green-500 text-white'
                      : 'bg-orange-500 text-white'
                  }`}>
                    {photo.photo_type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Modal */}
      {showModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground capitalize">
                  {selectedPhoto.photo_type} Photo
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedPhoto.file_size)} • {new Date(selectedPhoto.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPhoto(selectedPhoto)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeletePhoto(selectedPhoto)}
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeModal}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <img
                src={selectedPhoto.file_path}
                alt={`${selectedPhoto.photo_type} photo`}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


