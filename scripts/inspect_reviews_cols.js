import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log("Attempting insert with 'is_approved' column...");
  const res1 = await supabase.from('reviews').insert({
    order_id: '57a81316-4e2f-4bdc-90bc-f21428a7c64f',
    restaurant_id: '76830221-d0c7-4155-85dd-845b2069bfa9',
    user_id: '308e6d92-3bf3-460b-999c-9148352b2fd2',
    rating: 5,
    comment: 'Test is_approved',
    is_approved: false
  }).select();
  console.log("Res1 Error:", res1.error);

  console.log("Attempting insert with 'approved' column...");
  const res2 = await supabase.from('reviews').insert({
    order_id: '57a81316-4e2f-4bdc-90bc-f21428a7c64f',
    restaurant_id: '76830221-d0c7-4155-85dd-845b2069bfa9',
    user_id: '308e6d92-3bf3-460b-999c-9148352b2fd2',
    rating: 5,
    comment: 'Test approved',
    approved: false
  }).select();
  console.log("Res2 Error:", res2.error);
}
run();
