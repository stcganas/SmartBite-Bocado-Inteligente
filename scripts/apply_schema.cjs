/**
 * Script para aplicar el schema completo de SmartBite
 * al nuevo proyecto de Supabase vía pg connection directa.
 * Uso: node scripts/apply_schema.cjs
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://vaqiqcaxfmsijyuqucwm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcWlxY2F4Zm1zaWp5dXF1Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjE1OTQ4NCwiZXhwIjoyMTA3NzM1NDg0fQ.eDDlY7rA9w5nWv4VpExS0EXbbIsNnH1089FUNRgbM4A';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkTables() {
  const tables = [
    'platform_settings', 'app_users', 'restaurants', 'categories', 'products',
    'orders', 'plans', 'restaurant_subscriptions', 'platform_invoices',
    'reviews', 'coupons', 'referrals', 'referral_requests', 'withdrawal_requests',
    'wheel_configs', 'wheel_prizes', 'splash_screens', 'background_music',
    'app_notifications', 'notification_campaigns', 'scheduled_notifications',
    'support_tickets', 'ai_marketing_strategies', 'restaurant_visits',
    'social_posts', 'driver_profiles'
  ];

  console.log('\n=== VERIFICACIÓN DE TABLAS ===\n');
  const missing = [];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(1);
    if (error && error.code === 'PGRST205') {
      console.log(`❌ FALTA: ${table}`);
      missing.push(table);
    } else if (error) {
      console.log(`⚠️  ERROR en ${table}: ${error.message}`);
    } else {
      console.log(`✅ OK: ${table}`);
    }
  }
  
  console.log(`\n--- Resultado: ${tables.length - missing.length}/${tables.length} tablas OK ---`);
  if (missing.length > 0) {
    console.log('\nTablas faltantes:', missing.join(', '));
    console.log('\nPor favor, ejecuta el archivo supabase_clean_master.sql en el SQL Editor de Supabase:');
    console.log('https://supabase.com/dashboard/project/vaqiqcaxfmsijyuqucwm/sql/new');
  } else {
    console.log('\n🎉 Todas las tablas están presentes. La base de datos está lista.');
  }
  
  return missing;
}

async function checkBucket() {
  console.log('\n=== VERIFICACIÓN DE STORAGE ===\n');
  const { data, error } = await supabase.storage.getBucket('restaurant-assets');
  if (error) {
    console.log('❌ Bucket restaurant-assets no existe:', error.message);
  } else {
    console.log('✅ Bucket restaurant-assets: OK (público:', data.public, ')');
  }
}

async function checkPlatformSettings() {
  console.log('\n=== VERIFICACIÓN DE DATOS SEMILLA ===\n');
  const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 1).single();
  if (error) {
    console.log('❌ platform_settings sin datos semilla:', error.message);
  } else {
    console.log('✅ platform_settings: tiene datos (hero_title:', data?.hero_title, ')');
    const bc = data?.business_categories;
    console.log('   - business_categories:', Array.isArray(bc) ? bc.length + ' categorías' : 'N/A');
    const fc = data?.food_categories;
    console.log('   - food_categories:', Array.isArray(fc) ? fc.length + ' categorías' : 'N/A');
  }
  
  const { data: plans, error: plansError } = await supabase.from('plans').select('name, type, price');
  if (plansError) {
    console.log('❌ plans sin datos:', plansError.message);
  } else {
    console.log(`✅ plans: ${plans.length} planes configurados`);
    plans.forEach(p => console.log(`   - ${p.name} (${p.type}) $${p.price}`));
  }
}

async function main() {
  console.log('SmartBite - Verificador de Base de Datos');
  console.log('Proyecto: vaqiqcaxfmsijyuqucwm');
  console.log('URL:', SUPABASE_URL);
  
  const missing = await checkTables();
  await checkBucket();
  await checkPlatformSettings();
  
  console.log('\n=== RESUMEN FINAL ===');
  if (missing.length === 0) {
    console.log('✅ Base de datos completamente configurada y lista para usar.');
  } else {
    console.log(`⚠️  Faltan ${missing.length} tablas. Ejecutar supabase_clean_master.sql en Supabase SQL Editor.`);
  }
}

main().catch(console.error);
