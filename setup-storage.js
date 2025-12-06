const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.log('❌ Missing Supabase credentials');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupStorage() {
  console.log('🔧 Setting up permanent photo storage...');
  
  try {
    // Check if photos bucket exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
    
    if (listError) {
      console.log('❌ Error listing buckets:', listError.message);
      return;
    }
    
    const photosBucket = buckets.find(bucket => bucket.name === 'photos');
    
    if (!photosBucket) {
      console.log('📦 Creating photos bucket...');
      const { data, error: createError } = await supabase
        .storage
        .createBucket('photos', { public: true });
      
      if (createError) {
        console.log('❌ Error creating bucket:', createError.message);
        return;
      }
      
      console.log('✅ Photos bucket created and made public');
    } else if (photosBucket.public) {
      console.log('✅ Photos bucket is already public');
    } else {
      console.log('🔓 Making photos bucket public...');
      const { data, error: updateError } = await supabase
        .storage
        .updateBucket('photos', { public: true });
      
      if (updateError) {
        console.log('❌ Error making bucket public:', updateError.message);
        console.log('⚠️  Manual setup required: Go to Supabase Dashboard > Storage > photos > Settings > Make Public');
        return;
      }
      
      console.log('✅ Photos bucket is now public');
    }
    
    console.log('🎉 Photo storage setup complete!');
    console.log('Photos will now be stored permanently and load instantly.');
    
  } catch (error) {
    console.log('❌ Setup error:', error.message);
  }
}

setupStorage().catch(console.error);


