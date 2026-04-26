import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Verify user is authenticated
async function verifyAuth(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const { data } = await supabase.auth.getUser(token)
  return data.user?.id || null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await verifyAuth(req)

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        return res.status(200).json(data)
      }

      case 'POST': {
        const { title, category, assignedTo, dueDate, priority } = req.body

        const { data: userData } = await supabase.auth.admin.getUserById(userId)
        const userEmail = userData?.user?.email || ''
        const userName = userEmail.split('@')[0] === 'ramsarabia' ? 'Ram' : 'Fernanda'

        const { data, error } = await supabase
          .from('tasks')
          .insert({
            title,
            category,
            completed: false,
            assigned_to: assignedTo,
            due_date: dueDate,
            priority,
            last_updated_by: userName,
            created_by: userId,
          })
          .select()

        if (error) throw error
        return res.status(201).json(data[0])
      }

      case 'PUT': {
        const { id, completed, title, assignedTo, dueDate, priority } = req.body

        const { data: userData } = await supabase.auth.admin.getUserById(userId)
        const userEmail = userData?.user?.email || ''
        const userName = userEmail.split('@')[0] === 'ramsarabia' ? 'Ram' : 'Fernanda'

        const updateData: any = {
          last_updated_by: userName,
          last_updated_at: new Date().toISOString(),
        }

        if (completed !== undefined) updateData.completed = completed
        if (title !== undefined) updateData.title = title
        if (assignedTo !== undefined) updateData.assigned_to = assignedTo
        if (dueDate !== undefined) updateData.due_date = dueDate
        if (priority !== undefined) updateData.priority = priority

        const { data, error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', id)
          .select()

        if (error) throw error
        return res.status(200).json(data[0])
      }

      case 'DELETE': {
        const { id } = req.body

        const { error } = await supabase.from('tasks').delete().eq('id', id)

        if (error) throw error
        return res.status(204).send('')
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
