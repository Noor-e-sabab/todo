'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_date: string;
}

export default function DailyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [todayDate, setTodayDate] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // Set today's date
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    setTodayDate(today);

    loadTasks();

    // Check for midnight reset every minute
    const resetCheckInterval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        // It's midnight, refresh tasks
        loadTasks();
      }
    }, 60000); // Check every minute

    return () => clearInterval(resetCheckInterval);
  }, []);

  async function loadTasks() {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addTask() {
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Please enter a task' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Task added successfully' });
        resetForm();
        setShowForm(false);
        await loadTasks();
        setTimeout(() => setNotification(null), 2000);
      } else {
        setNotification({ type: 'error', message: 'Failed to add task' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      setNotification({ type: 'error', message: 'Error adding task' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit(id: number) {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Task updated successfully' });
        resetForm();
        setShowForm(false);
        await loadTasks();
        setTimeout(() => setNotification(null), 2000);
      } else {
        setNotification({ type: 'error', message: 'Failed to update task' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setNotification({ type: 'error', message: 'Error updating task' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setEditingId(null);
  }

  function startEdit(task: Task) {
    setTitle(task.title);
    setDescription(task.description);
    setEditingId(task.id);
    setShowForm(true);
  }

  async function toggleTask(id: number, completed: boolean) {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (response.ok) {
        await loadTasks();
      } else {
        setNotification({ type: 'error', message: 'Failed to update task' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      setNotification({ type: 'error', message: 'Error updating task' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setProcessingId(null);
    }
  }

  async function deleteTask(id: number) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setProcessingId(id);
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Task deleted successfully' });
        await loadTasks();
        setTimeout(() => setNotification(null), 2000);
      } else {
        setNotification({ type: 'error', message: 'Failed to delete task' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setNotification({ type: 'error', message: 'Error deleting task' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return <div className="text-center py-4 text-gray-800">Loading tasks...</div>;

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">📅 Daily Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">Today: {todayDate}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          disabled={submitting}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium disabled:cursor-not-allowed"
        >
          + Add Task
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-4 rounded" suppressHydrationWarning>
          <div className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter a new task..."
              value={title ?? ''}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <textarea
              placeholder="Description (optional)"
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 placeholder-gray-500"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => (editingId ? saveEdit(editingId) : addTask())}
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-4 py-2 rounded transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
            >
              {submitting && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {editingId ? 'Save' : 'Add'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              disabled={submitting}
              className="bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 text-white px-4 py-2 rounded transition-colors disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {notification && (
        <div className={`mb-4 p-3 rounded-lg animate-in fade-in slide-in-from-top-2 transition-all ${
          notification.type === 'success'
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {notification.type === 'success' ? '✓' : '✕'} {notification.message}
        </div>
      )}

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-700">
            No tasks yet. Add one to get started!
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                task.completed
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id, task.completed)}
                disabled={processingId === task.id}
                className="mt-1 w-5 h-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              />
              <div className="flex-1">
                <div
                  className={`font-medium ${
                    task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                  }`}
                >
                  {task.title}
                </div>
                {task.description && (
                  <div
                    className={`text-sm mt-1 ${
                      task.completed ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {task.description}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  📆 {task.created_date}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(task)}
                  disabled={processingId === task.id}
                  className="text-blue-900 hover:text-blue-950 font-bold transition-colors text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  disabled={processingId === task.id}
                  className={`text-sm font-medium transition-all ${
                    processingId === task.id
                      ? 'text-red-400 cursor-not-allowed opacity-50'
                      : 'text-red-600 hover:text-red-800'
                  }`}
                >
                  {processingId === task.id ? <span className="inline-block w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span> : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
