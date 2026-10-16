import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('app_users').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else if (data && data.length > 0) {
    console.log("Keys in app_users table:", Object.keys(data[0]));
    console.log("Full first row:", data[0]);
  } else {
    console.log("No rows found in app_users table, inserting a dummy one to inspect columns isn't needed, but let's see what columns exist in supabase.from('app_users').select() metadata.");
    // Wait, let's select a single row by some id or just check if we can fetch any columns
    console.log("Table is empty.");
  }
}
run();
