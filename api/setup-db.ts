import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check for setup token (simple auth)
  const token = req.headers['x-setup-token']
  if (token !== process.env.SETUP_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // Create table
    const { error } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS tasks (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          completed BOOLEAN DEFAULT false,
          assigned_to TEXT NOT NULL,
          due_date DATE,
          priority TEXT NOT NULL,
          last_updated_by TEXT NOT NULL,
          last_updated_at TIMESTAMP DEFAULT now(),
          created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT now()
        );

        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "authenticated_access" ON tasks;
        CREATE POLICY "authenticated_access"
          ON tasks FOR ALL
          USING (auth.uid() IS NOT NULL);
      `
    })

    if (error) {
      console.error('RPC error:', error)
      return res.status(500).json({ error: 'Failed to create table' })
    }

    return res.status(200).json({ success: true, message: 'Database setup complete' })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
