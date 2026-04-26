import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Plus, Calendar, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { LoginForm } from '@/components/LoginForm'
import { AddTaskNL } from '@/components/AddTaskNL'
import { supabase } from '@/lib/supabase'

interface Task {
  id: string
  title: string
  category: string
  completed: boolean
  assigned_to: 'Ram' | 'Fernanda' | 'Both'
  due_date: string | null
  priority: 'High' | 'Medium' | 'Low'
  last_updated_by: 'Ram' | 'Fernanda'
  last_updated_at: string
}

const categories = [
  { id: 'housing', label: 'Housing', icon: '🏠' },
  { id: 'currenthouse', label: 'Current House', icon: '🏡' },
  { id: 'job', label: "Fernanda's Job", icon: '💼' },
  { id: 'bills', label: 'Bills & Finances', icon: '💰' },
  { id: 'general', label: 'General', icon: '✓' }
]

function App() {
  const { session, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState('housing')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState<'Ram' | 'Fernanda' | 'Both'>('Both')
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [loading, setLoading] = useState(false)

  // Load tasks on mount and subscribe to changes
  useEffect(() => {
    if (!session) return

    const loadTasks = async () => {
      setLoading(true)
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const response = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
      setLoading(false)
    }

    loadTasks()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('tasks-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => loadTasks()
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [session])

  const addTask = async () => {
    if (!newTaskTitle.trim() || !session) return

    setLoading(true)
    const token = (await supabase.auth.getSession()).data.session?.access_token

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle,
          category: activeTab,
          assignedTo: newTaskAssignee,
          dueDate: newTaskDate || null,
          priority: newTaskPriority,
        }),
      })

      if (response.ok) {
        setNewTaskTitle('')
        setNewTaskAssignee('Both')
        setNewTaskPriority('Medium')
        setNewTaskDate('')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleTask = async (id: string, completed: boolean) => {
    if (!session) return

    const token = (await supabase.auth.getSession()).data.session?.access_token
    await fetch('/api/tasks', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, completed: !completed }),
    })
  }

  const deleteTask = async (id: string) => {
    if (!session) return

    const token = (await supabase.auth.getSession()).data.session?.access_token
    await fetch('/api/tasks', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!session) {
    return <LoginForm />
  }

  const categoryTasks = tasks.filter(t => t.category === activeTab)
  const completedCount = categoryTasks.filter(t => t.completed).length
  const totalCount = categoryTasks.length

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getUserName = () => {
    const email = session.user?.email || ''
    return email.includes('ramsarabia') ? 'Ram' : 'Fernanda'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Moving to Waco</h1>
              <p className="text-sm text-slate-500">Plan your move together</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">👤 {getUserName()}</span>
              <Button size="sm" variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-xs text-slate-600">
            {completedCount}/{totalCount} tasks complete
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full gap-1 bg-white p-1 rounded-lg shadow-sm">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                {cat.icon}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">{cat.label}</h2>
                  <div className="flex gap-1">
                    <AddTaskNL
                      category={cat.id}
                      onTaskCreated={() => {}}
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                          <Plus className="w-4 h-4" />
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Task: {cat.label}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Task</label>
                            <Input
                              placeholder="What needs to be done?"
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addTask()}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Assign to</label>
                            <Select value={newTaskAssignee} onValueChange={(v) => setNewTaskAssignee(v as 'Ram' | 'Fernanda' | 'Both')}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Ram">Ram</SelectItem>
                                <SelectItem value="Fernanda">Fernanda</SelectItem>
                                <SelectItem value="Both">Both</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Priority</label>
                            <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as 'High' | 'Medium' | 'Low')}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Due Date (optional)</label>
                            <Input
                              type="date"
                              value={newTaskDate}
                              onChange={(e) => setNewTaskDate(e.target.value)}
                            />
                          </div>
                          <Button onClick={addTask} className="w-full" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Task'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {categoryTasks.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-8 pb-8 text-center text-slate-500">
                      <p>No tasks yet. Create one to get started!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {categoryTasks.map(task => (
                      <Card key={task.id} className={`transition-opacity ${task.completed ? 'opacity-60' : ''}`}>
                        <CardContent className="pt-4">
                          <div className="flex gap-3">
                            <button
                              onClick={() => toggleTask(task.id, task.completed)}
                              className="flex-shrink-0 mt-1 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-slate-900 ${task.completed ? 'line-through text-slate-500' : ''}`}>
                                {task.title}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {task.assigned_to === 'Both' ? '👥' : task.assigned_to === 'Ram' ? '👤 Ram' : '👤 Fernanda'}
                                </Badge>
                                <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </Badge>
                                {task.due_date && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(task.due_date)}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-2">
                                Updated by {task.last_updated_by} • {new Date(task.last_updated_at).toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}

export default App
