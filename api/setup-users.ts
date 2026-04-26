import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const USERS = [
  { email: 'ramsarabia@gmail.com', password: process.env.RAM_PASSWORD! },
  { email: 'claufer94@gmail.com', password: process.env.FERNANDA_PASSWORD! },
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers['x-setup-token']
  if (!token || token !== process.env.SETUP_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const results: Record<string, string> = {}

  for (const user of USERS) {
    if (!user.password) {
      results[user.email] = 'skipped — password env var not set'
      continue
    }

    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.listUsers()
    const exists = existing?.users?.find(u => u.email === user.email)

    if (exists) {
      // Update password and confirm email
      const { error } = await supabase.auth.admin.updateUserById(exists.id, {
        password: user.password,
        email_confirm: true,
      })
      results[user.email] = error ? `update failed: ${error.message}` : 'updated (password + confirmed)'
    } else {
      // Create new user with email pre-confirmed
      const { error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      })
      results[user.email] = error ? `create failed: ${error.message}` : 'created'
    }
  }

  return res.status(200).json({ results })
}
