import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Adding raw_password column if not exists...");
  const sql = `
    ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS raw_password TEXT;
  `;
  const { data, error } = await supabase.rpc('execute_sql', { sql });
  if (error) {
    console.error("Error running execute_sql:", error);
  } else {
    console.log("Column verification/creation complete. Success:", data);
  }
}
run();
