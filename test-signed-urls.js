const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignedUrls() {
  console.log('🔍 Testing signed URL generation for photos...');
  
  // Get photos from database
  const { data: photos, error } = await supabase
    .from('photos')
    .select('*')
    .eq('appointment_id', '4641adf0-4257-424b-b4b4-2b043b797d00')
    .limit(3);
    
  if (error) {
    console.log('❌ Error fetching photos:', error.message);
    return;
  }
  
  console.log('📸 Found', photos.length, 'photos to test');
  
  for (const photo of photos) {
    console.log(`\n--- Testing Photo: ${photo.photo_type} ---`);
    console.log('File path:', photo.file_path);
    
    try {
      if (photo.file_path.startsWith('http')) {
        console.log('✅ Already full URL, testing access...');
        const response = await fetch(photo.file_path);
        console.log('Status:', response.status, response.ok ? '✅ Accessible' : '❌ Not accessible');
      } else {
        console.log('🔗 Generating signed URL...');
        const { data, error: urlError } = await supabase.storage
          .from('photos')
          .createSignedUrl(photo.file_path, 3600);
          
        if (urlError) {
          console.log('❌ Error creating signed URL:', urlError.message);
        } else {
          console.log('✅ Signed URL created');
          console.log('URL:', data.signedUrl.substring(0, 100) + '...');
          
          // Test the signed URL
          const response = await fetch(data.signedUrl);
          console.log('Status:', response.status, response.ok ? '✅ Accessible' : '❌ Not accessible');
        }
      }
    } catch (err) {
      console.log('❌ Error testing photo:', err.message);
    }
  }
}

testSignedUrls().catch(console.error);


