'use client';

import { useState, useEffect } from 'react';

interface Class {
  id: number;
  className: string;
  day: string;
  time: string;
  instructor: string;
  location: string;
  attended: boolean;
}

export default function WeeklyClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    className: '',
    day: '',
    time: '',
    instructor: '',
    location: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({ className: '', day: '', time: '', instructor: '', location: '' });
    setEditingId(null);
  }

  async function addClass() {
    if (!formData.className.trim() || !formData.day.trim() || !formData.time.trim()) {
      alert('Please fill in required fields');
      return;
    }

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        setShowForm(false);
        await loadClasses();
      }
    } catch (error) {
      console.error('Error adding class:', error);
    }
  }

  async function saveEdit(id: number) {
    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        await loadClasses();
      }
    } catch (error) {
      console.error('Error updating class:', error);
    }
  }

  async function deleteClass(id: number) {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      const response = await fetch(`/api/classes/${id}`, { method: 'DELETE' });

      if (response.ok) {
        await loadClasses();
      }
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  }

  async function toggleAttended(id: number, attended: boolean) {
    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended: !attended }),
      });

      if (response.ok) {
        await loadClasses();
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
    }
  }

  function startEdit(classItem: Class) {
    setFormData({
      className: classItem.className,
      day: classItem.day,
      time: classItem.time,
      instructor: classItem.instructor,
      location: classItem.location,
    });
    setEditingId(classItem.id);
    setShowForm(true);
  }

  if (loading) return <div className="text-center py-4 text-gray-800">Loading classes...</div>;

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow col-span-full">
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <h2 className="text-2xl font-semibold text-gray-800">📚 Weekly Class Schedule</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Class
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border-l-4 border-purple-500 p-4 mb-4 rounded">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <input
              type="text"
              placeholder="Class Name"
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Day"
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Instructor (optional)"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Location (optional)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => (editingId ? saveEdit(editingId) : addClass())}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition-colors"
            >
              {editingId ? 'Save' : 'Add'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="text-left p-3 text-gray-900">Class</th>
              <th className="text-left p-3 text-gray-900">Day</th>
              <th className="text-left p-3 text-gray-900">Time</th>
              <th className="text-left p-3 text-gray-900">Instructor</th>
              <th className="text-left p-3 text-gray-900">Location</th>
              <th className="text-center p-3 text-gray-900">Attended</th>
              <th className="text-center p-3 text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-700">
                  No classes added yet.
                </td>
              </tr>
            ) : (
              classes.map((classItem) => (
                <tr
                  key={classItem.id}
                  className={`border-b hover:bg-gray-50 transition-colors ${
                    classItem.attended ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="p-3 font-medium text-gray-900">{classItem.className}</td>
                  <td className="p-3 text-gray-900">{classItem.day}</td>
                  <td className="p-3 text-gray-900">{classItem.time}</td>
                  <td className="p-3 text-gray-900">{classItem.instructor || '-'}</td>
                  <td className="p-3 text-gray-900">{classItem.location || '-'}</td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={classItem.attended}
                      onChange={() => toggleAttended(classItem.id, classItem.attended)}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => startEdit(classItem)}
                      className="text-blue-500 hover:text-blue-700 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteClass(classItem.id)}
                      className="text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
