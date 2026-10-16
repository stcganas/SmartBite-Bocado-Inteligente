const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('--- Verificando y ajustando tabla orders ---');

  // Consulta columnas actuales de orders
  const { data: cols, error: colErr } = await supabase.rpc('exec_sql', {
    query: "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders';"
  });

  if (colErr) {
    console.log('exec_sql error:', colErr.message);
  } else {
    console.log('Columnas actuales:', cols);
  }

  // Agregamos las columnas adicionales si no existen
  const alterQueries = [
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'registered';",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_number TEXT;",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(12,2) DEFAULT 0;",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tip_percentage NUMERIC(5,2) DEFAULT 0;",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tip_type TEXT DEFAULT 'none';",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_name TEXT;",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS prize_won JSONB;"
  ];

  for (const q of alterQueries) {
    const { error } = await supabase.rpc('exec_sql', { query: q });
    if (error) console.log('Error en alter:', error.message);
  }

  console.log('--- Columnas añadidas / verificadas en orders ---');
}

main();
