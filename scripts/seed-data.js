#!/usr/bin/env node

/**
 * Seed script to create sample detailer and services for testing
 * Usage: node scripts/seed-data.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedData() {
  console.log('🌱 Seeding database with sample data...\n');

  try {
    // Check if detailer already exists
    const { data: existingDetailers } = await supabase
      .from('detailers')
      .select('id, detailer_id, business_name')
      .eq('detailer_id', 'test-detailer');

    let detailerId;

    if (existingDetailers && existingDetailers.length > 0) {
      console.log('✅ Detailer "test-detailer" already exists, skipping creation');
      detailerId = existingDetailers[0].id;
    } else {
      // Create test detailer
      const { data: newDetailer, error: detailerError } = await supabase
        .from('detailers')
        .insert({
          business_name: 'Test Auto Detailing',
          contact_name: 'Test User',
          email: 'test@example.com',
          phone: '+15551234567',
          detailer_id: 'test-detailer',
          is_active: true
        })
        .select()
        .single();

      if (detailerError) {
        throw new Error(`Failed to create detailer: ${detailerError.message}`);
      }

      console.log('✅ Created detailer: test-detailer');
      detailerId = newDetailer.id;
    }

    // Check for existing services
    const { data: existingServices } = await supabase
      .from('services')
      .select('id, name')
      .eq('detailer_id', detailerId);

    if (existingServices && existingServices.length > 0) {
      console.log(`✅ Found ${existingServices.length} existing service(s), skipping service creation`);
      existingServices.forEach(s => console.log(`   - ${s.name}`));
    } else {
      // Create sample services
      const services = [
        {
          detailer_id: detailerId,
          name: 'Basic Wash',
          description: 'Exterior wash with premium soap and rinse',
          price: 25.00,
          duration: 30,
          display_order: 1,
          category: 'Exterior',
          is_active: true
        },
        {
          detailer_id: detailerId,
          name: 'Wash & Wax',
          description: 'Complete exterior wash with hand wax application',
          price: 45.00,
          duration: 60,
          display_order: 2,
          category: 'Exterior',
          is_active: true
        },
        {
          detailer_id: detailerId,
          name: 'Full Detail',
          description: 'Complete interior and exterior detailing package',
          price: 150.00,
          duration: 180,
          display_order: 3,
          category: 'Complete',
          is_active: true
        },
        {
          detailer_id: detailerId,
          name: 'Interior Detail',
          description: 'Deep interior cleaning and protection',
          price: 75.00,
          duration: 120,
          display_order: 4,
          category: 'Interior',
          is_active: true
        }
      ];

      const { data: newServices, error: servicesError } = await supabase
        .from('services')
        .insert(services)
        .select();

      if (servicesError) {
        throw new Error(`Failed to create services: ${servicesError.message}`);
      }

      console.log(`✅ Created ${newServices.length} services:`);
      newServices.forEach(s => {
        console.log(`   - ${s.name}: $${s.price} (${s.duration} min)`);
      });
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Test Booking URL:');
    console.log(`   http://localhost:3000/book/test-detailer`);

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedData();
