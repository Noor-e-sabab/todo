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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
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
      alert('Please enter a task');
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        setTitle('');
        setDescription('');
        setShowForm(false);
        await loadTasks();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }

  async function toggleTask(id: number, completed: boolean) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (response.ok) {
        await loadTasks();
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  }

  async function deleteTask(id: number) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });

      if (response.ok) {
        await loadTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  if (loading) return <div className="text-center py-4">Loading tasks...</div>;

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <h2 className="text-2xl font-semibold text-gray-800">📅 Daily Tasks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Task
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
          <div className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter a new task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addTask}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
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
                className="mt-1 w-5 h-5 cursor-pointer"
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
                  Created: {task.created_date}
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
