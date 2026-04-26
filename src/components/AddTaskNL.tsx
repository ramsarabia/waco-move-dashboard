import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Wand2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AddTaskNLProps {
  category: string
  onTaskCreated: () => void
}

export function AddTaskNL({ category, onTaskCreated }: AddTaskNLProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!text.trim()) return

    setLoading(true)
    setError('')

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const response = await fetch('/api/parse-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: text.trim(), category }),
      })

      if (!response.ok) {
        throw new Error('Failed to parse task')
      }

      setText('')
      setOpen(false)
      onTaskCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Wand2 className="w-4 h-4" />
          Ask AI
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add task with AI</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Describe what needs to be done</label>
            <Textarea
              placeholder="e.g., 'remind me to call the realtor on Friday' or 'schedule house inspection next week'"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>

          {error && (
            <div className="flex gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading || !text.trim()} className="w-full">
            {loading ? 'Creating task...' : 'Create task'}
          </Button>

          <p className="text-xs text-slate-500">
            AI will parse your input and create a task in the {category} category
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
