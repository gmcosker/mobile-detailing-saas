const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.log('❌ Service role key not found in .env.local');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function makeBucketPublic() {
  console.log('🔧 Making photos bucket public using service role...');
  
  try {
    // Update bucket policy to allow public access
    const { data, error } = await supabase
      .from('storage.buckets')
      .update({ public: true })
      .eq('name', 'photos');
      
    if (error) {
      console.log('❌ Error making bucket public:', error.message);
    } else {
      console.log('✅ Photos bucket is now public!');
      console.log('Photos will now load indefinitely without signed URLs');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

makeBucketPublic().catch(console.error);



