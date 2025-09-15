import { createClient } from '@supabase/supabase-js'

// Service role client for admin operations
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Service role key not available for storage setup')
    return null
  }
  
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function ensurePhotosBucketIsPublic(): Promise<boolean> {
  const supabase = getServiceRoleClient()
  if (!supabase) {
    console.warn('Cannot setup storage - service role key missing')
    return false
  }

  try {
    console.log('🔧 Ensuring photos bucket is public...')
    
    // Check if bucket exists and is public
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return false
    }
    
    const photosBucket = buckets.find(bucket => bucket.name === 'photos')
    
    if (!photosBucket) {
      console.log('📦 Creating photos bucket...')
      const { data, error: createError } = await supabase
        .storage
        .createBucket('photos', { public: true })
      
      if (createError) {
        console.error('Error creating bucket:', createError)
        return false
      }
      
      console.log('✅ Photos bucket created and made public')
      return true
    }
    
    if (photosBucket.public) {
      console.log('✅ Photos bucket is already public')
      return true
    }
    
    // Try to make existing bucket public
    console.log('🔓 Making existing photos bucket public...')
    const { data, error: updateError } = await supabase
      .storage
      .updateBucket('photos', { public: true })
    
    if (updateError) {
      console.error('Error making bucket public:', updateError)
      console.log('⚠️  Manual setup required: Go to Supabase Dashboard > Storage > photos > Settings > Make Public')
      return false
    }
    
    console.log('✅ Photos bucket is now public')
    return true
    
  } catch (error) {
    console.error('Error in storage setup:', error)
    return false
  }
}

// Auto-setup function to run on app initialization
export async function initializeStorage(): Promise<void> {
  if (typeof window === 'undefined') {
    // Only run on server side
    await ensurePhotosBucketIsPublic()
  }
}

