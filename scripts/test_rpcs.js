import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

const commonRpcs = [
  { name: 'execute_sql', params: { sql: 'SELECT 1;' } },
  { name: 'exec_sql', params: { query: 'SELECT 1;' } },
  { name: 'exec_sql', params: { sql: 'SELECT 1;' } },
  { name: 'run_sql', params: { sql: 'SELECT 1;' } },
  { name: 'sql', params: { sql: 'SELECT 1;' } },
  { name: 'query', params: { sql: 'SELECT 1;' } },
  { name: 'exec', params: { sql: 'SELECT 1;' } },
];

async function run() {
  for (const rpc of commonRpcs) {
    console.log(`Checking RPC '${rpc.name}' with params ${JSON.stringify(rpc.params)}...`);
    try {
      const { data, error } = await supabase.rpc(rpc.name, rpc.params);
      if (error) {
        if (error.code === 'PGRST202') {
          console.log(`❌ ${rpc.name} does not exist (PGRST202).`);
        } else {
          console.log(`🤔 ${rpc.name} returned error code: ${error.code} - ${error.message}`);
        }
      } else {
        console.log(`✅ Success! RPC ${rpc.name} returned:`, data);
        break;
      }
    } catch (e) {
      console.log(`⚠️ ${rpc.name} exception:`, e);
    }
  }
}
run();
