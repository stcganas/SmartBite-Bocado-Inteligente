import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.app_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        type TEXT DEFAULT 'system',
        is_read BOOLEAN DEFAULT FALSE,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      
      -- If user_id needs to refer to auth.users but maybe we shouldn't enforce foreign key strictly if it fails
      
      -- Enable RLS
      ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      DROP POLICY IF EXISTS "Users can read own notifications" ON public.app_notifications;
      CREATE POLICY "Users can read own notifications" ON public.app_notifications FOR SELECT USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can update own notifications" ON public.app_notifications;
      CREATE POLICY "Users can update own notifications" ON public.app_notifications FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete own notifications" ON public.app_notifications;
      CREATE POLICY "Users can delete own notifications" ON public.app_notifications FOR DELETE USING (auth.uid() = user_id);
    `);
    console.log("Table 'app_notifications' created successfully!");
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

run();
