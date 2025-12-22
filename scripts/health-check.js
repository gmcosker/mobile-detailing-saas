#!/usr/bin/env node

/**
 * Health check script to verify Supabase connectivity and environment variables
 * Usage: node scripts/health-check.js
 */

require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const optionalEnvVars = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER'
];

console.log('🔍 Health Check: Verifying Environment Variables\n');

// Check required variables
let allRequiredPresent = true;
for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (!value) {
    console.log(`❌ Missing required: ${envVar}`);
    allRequiredPresent = false;
  } else {
    const masked = envVar.includes('KEY') || envVar.includes('SECRET') || envVar.includes('TOKEN')
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`✅ ${envVar}: ${masked}`);
  }
}

console.log('\n📋 Optional Variables:');
for (const envVar of optionalEnvVars) {
  const value = process.env[envVar];
  if (value) {
    const masked = envVar.includes('KEY') || envVar.includes('SECRET') || envVar.includes('TOKEN')
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`  ✅ ${envVar}: ${masked}`);
  } else {
    console.log(`  ⚠️  ${envVar}: Not set (optional)`);
  }
}

if (!allRequiredPresent) {
  console.log('\n❌ Health check failed: Missing required environment variables');
  console.log('Please ensure all required variables are set in .env.local');
  process.exit(1);
}

// Test Supabase connectivity
console.log('\n🔌 Testing Supabase Connectivity...\n');

async function testSupabase() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connectivity
    const { data, error } = await supabase
      .from('detailers')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`❌ Supabase connection error: ${error.message}`);
      
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('   💡 Tip: Make sure you have run the database schema migrations');
      }
      if (error.message.includes('JWT')) {
        console.log('   💡 Tip: Check that your SUPABASE_ANON_KEY is correct');
      }
      
      process.exit(1);
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
      const { data: adminData, error: adminError } = await adminSupabase
        .from('detailers')
        .select('count')
        .limit(1);
      
      if (adminError) {
        console.log(`⚠️  Service role key test failed: ${adminError.message}`);
      } else {
        console.log('✅ Service role key valid');
      }
    }
    
    // Check for detailers
    const { data: detailers, error: detailersError } = await supabase
      .from('detailers')
      .select('id, detailer_id, business_name, is_active')
      .limit(10);
    
    if (!detailersError && detailers) {
      console.log(`\n📊 Found ${detailers.length} detailer(s) in database:`);
      detailers.forEach(d => {
        console.log(`   - ${d.business_name} (${d.detailer_id}) ${d.is_active ? '✅' : '❌ inactive'}`);
      });
      
      if (detailers.length === 0) {
        console.log('   ⚠️  No detailers found. Run seed script to create sample data.');
      }
    }
    
    // Check for services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, detailer_id, is_active')
      .limit(10);
    
    if (!servicesError && services) {
      console.log(`\n📋 Found ${services.length} service(s) in database`);
      if (services.length === 0) {
        console.log('   ⚠️  No services found. Run seed script to create sample services.');
      }
    }
    
    console.log('\n✅ Health check passed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testSupabase();
