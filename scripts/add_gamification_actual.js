
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is missing. Cannot run SQL.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Attempting to add gamification_enabled column to restaurants table using execute_sql RPC...");
  const sql = `
    ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS gamification_enabled BOOLEAN DEFAULT false;
  `;
  const { data, error } = await supabase.rpc('execute_sql', { sql });
  
  if (error) {
    console.error("Error executing SQL via RPC:", error);
    console.log("Attempting second strategy: storing in payment_gateways (fallback already implemented in code).");
  } else {
    console.log("Column 'gamification_enabled' added successfully! Result:", data);
  }
}

run();
