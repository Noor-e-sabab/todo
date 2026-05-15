'use client';

import { useState, useEffect } from 'react';

interface Goal {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_date: string;
}

export default function MonthlyGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    try {
      const response = await fetch('/api/goals');
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addGoal() {
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Please enter a goal' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Goal added successfully' });
        resetForm();
        setShowForm(false);
        await loadGoals();
        setTimeout(() => setNotification(null), 2000);
      } else {
        setNotification({ type: 'error', message: 'Failed to add goal' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error adding goal:', error);
      setNotification({ type: 'error', message: 'Error adding goal' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit(id: number) {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Goal updated successfully' });
        resetForm();
        setShowForm(false);
        await loadGoals();
        setTimeout(() => setNotification(null), 2000);
      } else {
        setNotification({ type: 'error', message: 'Failed to update goal' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      setNotification({ type: 'error', message: 'Error updating goal' });
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

  function startEdit(goal: Goal) {
    setTitle(goal.title);
    setDescription(goal.description);
    setEditingId(goal.id);
    setShowForm(true);
  }

  async function toggleGoal(id: number, completed: boolean) {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (response.ok) {
        await loadGoals();
      } else {
        setNotification({ type: 'error', message: 'Failed to update goal' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error toggling goal:', error);
      setNotification({ type: 'error', message: 'Error updating goal' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setProcessingId(null);
    }
  }

  async function deleteGoal(id: number) {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    setProcessingId(id);
    try {
      const response = await fetch(`/api/goals/${id}`, { method: 'DELETE' });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Goal deleted successfully' });
        await loadGoals();
        setTimeout(() => setNotification(null), 2000);
      } else {
        setNotification({ type: 'error', message: 'Failed to delete goal' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      setNotification({ type: 'error', message: 'Error deleting goal' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return <div className="text-center py-4 text-gray-800">Loading goals...</div>;

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <h2 className="text-2xl font-semibold text-gray-800">🎯 Monthly Goals</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          disabled={submitting}
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium disabled:cursor-not-allowed"
        >
          + Add Goal
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border-l-4 border-green-500 p-4 mb-4 rounded" suppressHydrationWarning>
          <div className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter a monthly goal..."
              value={title ?? ''}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
              onKeyPress={(e) => e.key === 'Enter' && addGoal()}
            />
            <textarea
              placeholder="Description (optional)"
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-gray-900 placeholder-gray-500"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => (editingId ? saveEdit(editingId) : addGoal())}
              disabled={submitting}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-4 py-2 rounded transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
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
        {goals.length === 0 ? (
          <div className="text-center py-8 text-gray-700">
            No goals yet. Set one to stay motivated!
          </div>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                goal.completed
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-white border-gray-200 hover:border-green-300'
              }`}
            >
              <input
                type="checkbox"
                checked={goal.completed}
                onChange={() => toggleGoal(goal.id, goal.completed)}
                disabled={processingId === goal.id}
                className="mt-1 w-5 h-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              />
              <div className="flex-1">
                <div
                  className={`font-medium ${
                    goal.completed ? 'line-through text-gray-500' : 'text-gray-800'
                  }`}
                >
                  {goal.title}
                </div>
                {goal.description && (
                  <div
                    className={`text-sm mt-1 ${
                      goal.completed ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {goal.description}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  Created: {goal.created_date}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(goal)}
                  disabled={processingId === goal.id}
                  className="text-blue-900 hover:text-blue-950 font-bold transition-colors text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  disabled={processingId === goal.id}
                  className={`text-sm font-medium transition-all ${
                    processingId === goal.id
                      ? 'text-red-400 cursor-not-allowed opacity-50'
                      : 'text-red-600 hover:text-red-800'
                  }`}
                >
                  {processingId === goal.id ? <span className="inline-block w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span> : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
