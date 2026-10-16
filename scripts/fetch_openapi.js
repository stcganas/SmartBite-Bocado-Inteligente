import fetch from "node-fetch";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
  const url = `${supabaseUrl}/rest/v1/`;
  console.log("Fetching OpenAPI spec from:", url);
  try {
    const res = await fetch(url, {
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`
      }
    });
    if (!res.ok) {
      console.error("HTTP error:", res.status, res.statusText);
      return;
    }
    const data = await res.json();
    console.log("Tables/Paths in schema:");
    const paths = Object.keys(data.paths || {});
    console.log(paths.filter(p => p.startsWith("/rpc/")));
    
    // Check if there is review table info
    if (data.definitions && data.definitions.reviews) {
      console.log("Reviews Definition:", JSON.stringify(data.definitions.reviews.properties, null, 2));
    } else {
      console.log("Reviews definition not found in schemas.");
    }
  } catch (error) {
    console.error("Fetch Exception:", error);
  }
}
run();
