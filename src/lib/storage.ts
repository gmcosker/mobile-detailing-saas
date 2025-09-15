import { getSupabaseClient } from './supabase'

// Photo storage utilities
export const photoStorage = {
  // Upload a photo to Supabase storage
  async uploadPhoto(file: File, appointmentId: string, photoType: 'before' | 'after' | 'during'): Promise<string | null> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${appointmentId}/${photoType}_${Date.now()}.${fileExt}`
      const filePath = `photos/${fileName}`

      const supabase = getSupabaseClient()
      if (!supabase) {
        console.log('Supabase not configured, using demo mode')
        // Return a demo URL for development
        return `https://via.placeholder.com/400/0066cc/ffffff?text=${photoType.toUpperCase()}+Photo`
      }

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error uploading photo:', error)
        return null
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath)

      return publicData.publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  },

  // Delete a photo from storage
  async deletePhoto(filePath: string): Promise<boolean> {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.log('Supabase not configured, simulating delete success')
        return true
      }

      const { error } = await supabase.storage
        .from('photos')
        .remove([filePath])

      if (error) {
        console.error('Error deleting photo:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Delete error:', error)
      return false
    }
  },

  // Get signed URL for private photos (if needed)
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.log('Supabase not configured, returning demo URL')
        return 'https://via.placeholder.com/400/0066cc/ffffff?text=Demo+Photo'
      }

      const { data, error } = await supabase.storage
        .from('photos')
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        console.error('Error creating signed URL:', error)
        return null
      }

      return data.signedUrl
    } catch (error) {
      console.error('Signed URL error:', error)
      return null
    }
  },

  // Compress image before upload (client-side)
  async compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file) // Fallback to original
            }
          },
          file.type,
          quality
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }
}

// Image validation utilities
export const imageValidation = {
  // Check if file is a valid image
  isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    return validTypes.includes(file.type)
  },

  // Check file size (in MB)
  isValidSize(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return file.size <= maxSizeBytes
  },

  // Get file size in readable format
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

