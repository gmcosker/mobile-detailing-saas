require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Supabase URL or Service Role Key not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

async function resetTestData() {
  console.log('🔄 Resetting test data for fresh testing...\n');

  try {
    // Get detailer
    const { data: detailer, error: detailerError } = await supabase
      .from('detailers')
      .select('*')
      .eq('detailer_id', 'premium-auto')
      .single();

    if (detailerError) {
      console.error('Error fetching detailer:', detailerError.message);
      return;
    }

    // Delete test appointments (keep the original sample data)
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('detailer_id', detailer.id)
      .neq('customer_id', (await supabase.from('customers').select('id').eq('name', 'Jane Doe').single()).data.id);

    if (deleteError) {
      console.error('Error deleting test appointments:', deleteError.message);
      return;
    }

    // Delete test customers (keep Jane Doe)
    const { error: deleteCustomersError } = await supabase
      .from('customers')
      .delete()
      .neq('name', 'Jane Doe');

    if (deleteCustomersError) {
      console.error('Error deleting test customers:', deleteCustomersError.message);
      return;
    }

    console.log('✅ Test data reset complete!');
    console.log('🌐 Now test at: http://localhost:3000/book/premium-auto');
    console.log('   - All time slots should be available');
    console.log('   - Book a slot, then try to book the same slot in another browser');

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
  }
}

resetTestData().catch(console.error);

