const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPhotoFix() {
  console.log('🔍 Testing complete photo fix...');
  
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
    console.log('Stored file_path:', photo.file_path);
    
    try {
      let testUrl;
      
      if (photo.file_path.startsWith('http')) {
        // Extract the correct path from the stored URL
        const url = new URL(photo.file_path);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(4).join('/');
        console.log('Extracted file path:', filePath);
        
        // Generate signed URL
        const { data, error: urlError } = await supabase.storage
          .from('photos')
          .createSignedUrl(filePath, 3600);
          
        if (urlError) {
          console.log('❌ Error creating signed URL:', urlError.message);
          continue;
        }
        
        testUrl = data.signedUrl;
        console.log('Generated signed URL');
      } else {
        // Generate signed URL for relative path
        const { data, error: urlError } = await supabase.storage
          .from('photos')
          .createSignedUrl(photo.file_path, 3600);
          
        if (urlError) {
          console.log('❌ Error creating signed URL:', urlError.message);
          continue;
        }
        
        testUrl = data.signedUrl;
        console.log('Generated signed URL for relative path');
      }
      
      // Test the URL
      const response = await fetch(testUrl);
      console.log('Status:', response.status, response.ok ? '✅ Accessible' : '❌ Not accessible');
      
      if (response.ok) {
        console.log('🎉 Photo is accessible!');
      }
      
    } catch (err) {
      console.log('❌ Error testing photo:', err.message);
    }
  }
  
  console.log('\n✅ Photo fix test completed!');
}

testPhotoFix().catch(console.error);

