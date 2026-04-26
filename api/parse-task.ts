import { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text, category } = req.body
    const authHeader = req.headers.authorization

    if (!text || !category) {
      return res.status(400).json({ error: 'Missing text or category' })
    }

    // Verify auth token
    let userId: string | null = null
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data } = await supabase.auth.getUser(token)
      userId = data.user?.id || null
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get user email for assignee logic
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    const userEmail = userData?.user?.email || ''

    const prompt = `Parse this user input into a task with structured data.

User input: "${text}"
Task category: ${category}
User email: ${userEmail}
Ram's email: ramsarabia@gmail.com
Fernanda's email: claufer94@gmail.com

Extract and return ONLY a JSON object (no markdown, no explanation) with:
- title: clear, concise task title
- assignedTo: "Ram", "Fernanda", or "Both" (default to "Both" unless the user mentions a specific person)
- dueDate: ISO date string (YYYY-MM-DD) if mentioned, null otherwise. Parse relative dates like "Friday", "next week", "tomorrow"
- priority: "High", "Medium", or "Low" (infer from urgency, default "Medium")

Example output:
{"title":"Call the realtor","assignedTo":"Both","dueDate":"2026-05-02","priority":"High"}`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const parsed = JSON.parse(content.text)

    // Save to Supabase
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: parsed.title,
        category: category,
        completed: false,
        assigned_to: parsed.assignedTo,
        due_date: parsed.dueDate,
        priority: parsed.priority,
        last_updated_by: userEmail.split('@')[0] === 'ramsarabia' ? 'Ram' : 'Fernanda',
        created_by: userId,
      })
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Failed to save task' })
    }

    return res.status(201).json(data[0])
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
