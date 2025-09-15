const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPhotosAppointment() {
  console.log('🔍 Debugging photos and appointments relationship...');
  
  // Get the appointment ID from our sample data
  const appointmentId = '4641adf0-4257-424b-b4b4-2b043b797d00';
  
  console.log('📅 Checking appointment:', appointmentId);
  
  // Get appointment details
  const { data: appointment, error: aptError } = await supabase
    .from('appointments')
    .select(`
      *,
      customers (*)
    `)
    .eq('id', appointmentId)
    .single();
    
  if (aptError) {
    console.log('❌ Error fetching appointment:', aptError.message);
  } else {
    console.log('✅ Appointment found:');
    console.log('  Customer:', appointment.customers?.name);
    console.log('  Service:', appointment.service_type);
    console.log('  Date:', appointment.scheduled_date);
  }
  
  // Get photos for this appointment
  console.log('\n📸 Checking photos for this appointment...');
  const { data: photos, error: photoError } = await supabase
    .from('photos')
    .select('*')
    .eq('appointment_id', appointmentId);
    
  if (photoError) {
    console.log('❌ Error fetching photos:', photoError.message);
  } else {
    console.log('✅ Found', photos.length, 'photos for this appointment:');
    photos.forEach((photo, index) => {
      console.log(`  ${index + 1}. ${photo.photo_type} - ${photo.file_path}`);
    });
  }
  
  // Also check all photos to see what appointment IDs exist
  console.log('\n🔍 Checking all photos and their appointment IDs...');
  const { data: allPhotos, error: allPhotosError } = await supabase
    .from('photos')
    .select('id, appointment_id, photo_type, file_path');
    
  if (allPhotosError) {
    console.log('❌ Error fetching all photos:', allPhotosError.message);
  } else {
    console.log('📸 All photos in database:');
    allPhotos.forEach((photo, index) => {
      console.log(`  ${index + 1}. Appointment: ${photo.appointment_id}, Type: ${photo.photo_type}`);
    });
  }
}

debugPhotosAppointment().catch(console.error);

