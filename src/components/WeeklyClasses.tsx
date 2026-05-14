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
    timeFrom: '',
    timeTo: '',
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
    setFormData({ className: '', day: '', timeFrom: '', timeTo: '', instructor: '', location: '' });
    setEditingId(null);
  }

  async function addClass() {
    if (!formData.className.trim() || !formData.day.trim() || !formData.timeFrom.trim() || !formData.timeTo.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const classData = {
        ...formData,
        time: `${formData.timeFrom}-${formData.timeTo}`,
      };
      delete (classData as any).timeFrom;
      delete (classData as any).timeTo;

      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData),
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
      const classData = {
        ...formData,
        time: `${formData.timeFrom}-${formData.timeTo}`,
      };
      delete (classData as any).timeFrom;
      delete (classData as any).timeTo;

      const response = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData),
      });

      if (response.ok) {
        resetForm();
        setShowForm(false);
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

  function getTimeInMinutes(time: string): number {
    // Handle time format like "8:30AM-10:00AM" or "8:30AM" or "08:30"
    const timeStr = time.split('-')[0].trim(); // Get first time if it's a range
    const match = timeStr.match(/(\d+):(\d+)/);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      
      // Handle AM/PM
      if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
        hours += 12;
      }
      if (timeStr.toUpperCase().includes('AM') && hours === 12) {
        hours = 0;
      }
      
      return hours * 60 + minutes;
    }
    return 0;
  }

  function formatMinutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  function getClassesByDay() {
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped: { [key: string]: Class[] } = {};

    classes.forEach((classItem) => {
      if (!grouped[classItem.day]) {
        grouped[classItem.day] = [];
      }
      grouped[classItem.day].push(classItem);
    });

    // Sort classes within each day by time
    Object.keys(grouped).forEach((day) => {
      grouped[day].sort((a, b) => getTimeInMinutes(a.time) - getTimeInMinutes(b.time));
    });

    // Return days in order with gaps
    return dayOrder
      .filter((day) => grouped[day])
      .map((day) => ({
        day,
        classes: grouped[day],
      }));
  }

  function startEdit(classItem: Class) {
    const [timeFrom, timeTo] = classItem.time.split('-');
    setFormData({
      className: classItem.className,
      day: classItem.day,
      timeFrom: timeFrom.trim(),
      timeTo: timeTo.trim(),
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
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
            />
            <select
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            >
              <option value="">Select Day</option>
              <option value="Sunday">Sunday</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>
            <input
              type="time"
              placeholder="From Time"
              value={formData.timeFrom}
              onChange={(e) => setFormData({ ...formData, timeFrom: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
            <input
              type="time"
              placeholder="To Time"
              value={formData.timeTo}
              onChange={(e) => setFormData({ ...formData, timeTo: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
            <input
              type="text"
              placeholder="Instructor (optional)"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="Location (optional)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500 col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => (editingId ? saveEdit(editingId) : addClass())}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition-colors font-medium"
            >
              {editingId ? 'Save' : 'Add'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        {classes.length === 0 ? (
          <div className="text-center py-8 text-gray-700">No classes added yet.</div>
        ) : (
          <div className="space-y-6">
            {getClassesByDay().map(({ day, classes: dayClasses }) => (
              <div key={day} className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{day}</h3>
                <div className="space-y-2">
                  {dayClasses.map((classItem, index) => {
                    const nextClass = dayClasses[index + 1];
                    const currentTimeInMinutes = getTimeInMinutes(classItem.time);
                    const gapMinutes = nextClass
                      ? getTimeInMinutes(nextClass.time) - currentTimeInMinutes
                      : 0;
                    const hasGap = nextClass && gapMinutes > 0;

                    return (
                      <div key={classItem.id}>
                        <div
                          className={`p-4 rounded-lg border transition-all ${
                            classItem.attended
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200 hover:shadow-md'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{classItem.className}</h4>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Time:</span> {classItem.time}
                              </p>
                              {classItem.instructor && (
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Instructor:</span> {classItem.instructor}
                                </p>
                              )}
                              {classItem.location && (
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Location:</span> {classItem.location}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={classItem.attended}
                                  onChange={() => toggleAttended(classItem.id, classItem.attended)}
                                  className="w-5 h-5"
                                />
                                <span className="text-sm text-gray-700">Attended</span>
                              </label>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => startEdit(classItem)}
                              className="text-blue-900 hover:text-blue-950 font-bold transition-colors text-sm underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteClass(classItem.id)}
                              className="text-red-500 hover:text-red-700 font-medium transition-colors text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {hasGap && (
                          <div className="flex items-center justify-center py-3">
                            <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                            <span className="mx-3 text-sm text-gray-500 font-medium">
                              Break: {gapMinutes} min
                            </span>
                            <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
