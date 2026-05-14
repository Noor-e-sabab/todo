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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

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
      alert('Please enter a goal');
      return;
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        setTitle('');
        setDescription('');
        setShowForm(false);
        await loadGoals();
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  }

  async function toggleGoal(id: number, completed: boolean) {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (response.ok) {
        await loadGoals();
      }
    } catch (error) {
      console.error('Error toggling goal:', error);
    }
  }

  async function deleteGoal(id: number) {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const response = await fetch(`/api/goals/${id}`, { method: 'DELETE' });

      if (response.ok) {
        await loadGoals();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  }

  if (loading) return <div className="text-center py-4">Loading goals...</div>;

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <h2 className="text-2xl font-semibold text-gray-800">🎯 Monthly Goals</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Goal
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border-l-4 border-green-500 p-4 mb-4 rounded">
          <div className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter a monthly goal..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyPress={(e) => e.key === 'Enter' && addGoal()}
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addGoal}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
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
        {goals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
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
                className="mt-1 w-5 h-5 cursor-pointer"
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
              <button
                onClick={() => deleteGoal(goal.id)}
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
