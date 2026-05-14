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

interface FormClass {
  className: string;
  day: string;
  timeFrom: string;
  timeTo: string;
  instructor: string;
  location: string;
}

export default function WeeklyClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showRawImport, setShowRawImport] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formClasses, setFormClasses] = useState<FormClass[]>([
    { className: '', day: '', timeFrom: '', timeTo: '', instructor: '', location: '' },
  ]);
  const [rawData, setRawData] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setFormClasses([{ className: '', day: '', timeFrom: '', timeTo: '', instructor: '', location: '' }]);
    setEditingId(null);
    setError(null);
  }

  function addFormRow() {
    setFormClasses([...formClasses, { className: '', day: '', timeFrom: '', timeTo: '', instructor: '', location: '' }]);
  }

  function removeFormRow(index: number) {
    if (formClasses.length > 1) {
      setFormClasses(formClasses.filter((_, i) => i !== index));
    }
  }

  function updateFormClass(index: number, field: keyof FormClass, value: string) {
    const updated = [...formClasses];
    updated[index] = { ...updated[index], [field]: value };
    setFormClasses(updated);
  }

  function parseRawData(data: string) {
    if (!data || data.trim().length === 0) {
      setError('Please paste data first');
      return;
    }
    try {
      const dayMap: { [key: string]: string } = {
        'M': 'Monday',
        'T': 'Tuesday',
        'W': 'Wednesday',
        'R': 'Thursday',
        'F': 'Friday',
        'S': 'Sunday',
        'U': 'Monday'
      };

      function parseDayString(dayStr: string): string[] {
        const days: string[] = [];
        for (let i = 0; i < dayStr.length; i++) {
          const char = dayStr[i].toUpperCase();
          if (dayMap[char]) {
            days.push(dayMap[char]);
          }
        }
        return days;
      }

      function convertTo24Hour(timeStr: string): string {
        // Convert "8:30AM", "10:00PM", "08:30", etc. to "08:30" or "22:00"
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!match) return timeStr;
        
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const meridiem = match[3]?.toUpperCase();
        
        // Handle 12-hour to 24-hour conversion
        if (meridiem === 'PM' && hours !== 12) {
          hours += 12;
        }
        if (meridiem === 'AM' && hours === 12) {
          hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      }

      const lines = data.trim().split('\n').filter(line => line.trim());
      const parsed: FormClass[] = [];

      for (const line of lines) {
        // Skip header rows
        if (line.includes('Serial') || line.includes('Course') || line.includes('Timing') || 
            line.match(/^No\.|^S\.|^Row/i)) {
          continue;
        }

        // Pattern 1: Extract time range (most reliable pattern first)
        const timeMatch = line.match(/(\d{1,2}:\d{2}(?:AM|PM)?)\s*-\s*(\d{1,2}:\d{2}(?:AM|PM)?)/i);
        if (!timeMatch) continue;

        // Convert times to 24-hour format
        const timeFrom = convertTo24Hour(timeMatch[1]);
        const timeTo = convertTo24Hour(timeMatch[2]);

        // Pattern 2: Extract day sequence (letters before time)
        const beforeTimeStr = line.substring(0, timeMatch.index || 0);
        const dayMatch = beforeTimeStr.match(/([MTWRFSU]{1,7})\s*$/);
        if (!dayMatch) continue;

        const dayStr = dayMatch[1].toUpperCase();
        const days = parseDayString(dayStr);
        if (days.length === 0) continue;

        // Pattern 3: Extract course code/name (before time/days)
        const courseMatch = line.match(/\b([A-Z]{2,6}\d{2,4}(?:\s+Lab)?)\b/i);
        if (!courseMatch) continue;

        const courseName = courseMatch[1].trim();

        // Pattern 4: Extract room (after time)
        const afterTimeStr = line.substring((timeMatch.index || 0) + timeMatch[0].length);
        const roomMatch = afterTimeStr.match(/\b([A-Z0-9]{2,}-?\d{2,}|[0-9]{3,4})\b/);
        const location = roomMatch ? roomMatch[1].trim() : '';

        // Create entry for each day
        days.forEach(day => {
          parsed.push({
            className: courseName,
            day: day,
            timeFrom: timeFrom,
            timeTo: timeTo,
            instructor: '',
            location: location
          });
        });
      }

      if (parsed.length > 0) {
        setFormClasses(parsed);
        setRawData('');
        setShowRawImport(false);
        setShowForm(true);  // Show the form to display parsed data
        setError(null);
      } else {
        setError('Could not parse any classes from the provided data. Make sure to include: Course Code, Days (M/T/W/R/F/S), Time (HH:MM format), and Room Number.');
      }
    } catch (err) {
      setError('Error parsing raw data. Please check the format.');
    }
  }

  async function addAllClasses() {
    const validClasses = formClasses.filter(f => f.className.trim() && f.day.trim() && f.timeFrom.trim() && f.timeTo.trim());
    
    if (validClasses.length === 0) {
      setError('Please fill in all required fields for at least one class');
      return;
    }

    setError(null);
    const results = { success: 0, failed: 0, conflicts: [] };

    for (const formClass of validClasses) {
      try {
        const classData = {
          className: formClass.className,
          day: formClass.day,
          time: `${formClass.timeFrom}-${formClass.timeTo}`,
          instructor: formClass.instructor || '',
          location: formClass.location || '',
        };

        const response = await fetch('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(classData),
        });

        if (response.status === 409) {
          const data = await response.json();
          results.conflicts.push(`${formClass.className}: ${data.error}`);
          results.failed++;
        } else if (response.ok) {
          results.success++;
        } else {
          results.failed++;
        }
      } catch (err) {
        results.failed++;
      }
    }

    if (results.conflicts.length > 0) {
      setError(`Added ${results.success} classes. Conflicts: ${results.conflicts.join('; ')}`);
    } else if (results.failed > 0) {
      setError(`Added ${results.success} classes. ${results.failed} failed.`);
    }

    if (results.success > 0) {
      resetForm();
      setShowForm(false);
      await loadClasses();
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

  function getEndTimeInMinutes(time: string): number {
    // Extract end time from range like "8:30AM-10:00AM"
    const parts = time.split('-');
    if (parts.length < 2) return 0;
    
    const timeStr = parts[1].trim();
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

  function formatTime24To12(time: string): string {
    // Convert "08:30-10:00" to "8:30 AM - 10:00 AM"
    const parts = time.split('-').map(t => t.trim());
    if (parts.length !== 2) return time;
    
    const formatSingleTime = (t: string): string => {
      const match = t.match(/(\d{1,2}):(\d{2})/);
      if (!match) return t;
      
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const meridiem = hours >= 12 ? 'PM' : 'AM';
      
      if (hours > 12) {
        hours -= 12;
      } else if (hours === 0) {
        hours = 12;
      }
      
      return `${hours}:${minutes} ${meridiem}`;
    };
    
    return `${formatSingleTime(parts[0])} - ${formatSingleTime(parts[1])}`;
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
    setFormClasses([{
      className: classItem.className,
      day: classItem.day,
      timeFrom: timeFrom.trim(),
      timeTo: timeTo.trim(),
      instructor: classItem.instructor,
      location: classItem.location,
    }]);
    setEditingId(classItem.id);
    setShowForm(true);
  }

  async function saveEdit(id: number) {
    setError(null);
    const formClass = formClasses[0];

    if (!formClass.className.trim() || !formClass.day.trim() || !formClass.timeFrom.trim() || !formClass.timeTo.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const classData = {
        className: formClass.className,
        day: formClass.day,
        time: `${formClass.timeFrom}-${formClass.timeTo}`,
        instructor: formClass.instructor || '',
        location: formClass.location || '',
      };

      const response = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData),
      });

      if (response.status === 409) {
        const data = await response.json();
        setError(data.error);
        return;
      }

      if (response.ok) {
        resetForm();
        setShowForm(false);
        await loadClasses();
      }
    } catch (err) {
      console.error('Error updating class:', err);
      setError('Failed to update class');
    }
  }

  if (loading) return <div className="text-center py-4 text-gray-800">Loading classes...</div>;

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow col-span-full">
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <h2 className="text-2xl font-semibold text-gray-800">📚 Weekly Class Schedule</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
              setShowRawImport(false);
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Add Classes
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowRawImport(!showRawImport);
              setShowForm(false);
            }}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            📋 Import Raw Data
          </button>
        </div>
      </div>

      {showRawImport && (
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-4 rounded">
          <h3 className="font-semibold text-gray-900 mb-2">Paste Raw Class Data</h3>
          <p className="text-sm text-gray-600 mb-2">Paste your course data (CSV, table, or text format):</p>
          <textarea
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            placeholder="Paste your class data here..."
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 mb-2"
            rows={4}
            suppressHydrationWarning
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Get textarea value directly
                const textarea = document.querySelector('textarea');
                const data = textarea ? textarea.value : rawData;
                parseRawData(data);
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded transition-colors"
            >
              Parse & Import
            </button>
            <button
              onClick={() => {
                setShowRawImport(false);
                setRawData('');
                setError(null);
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-50 border-l-4 border-purple-500 p-4 mb-4 rounded" suppressHydrationWarning>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4 mb-4">
            {formClasses.map((formClass, index) => (
              <div key={index} className="bg-white p-3 rounded border border-gray-200">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Class Name"
                    value={formClass.className ?? ''}
                    onChange={(e) => updateFormClass(index, 'className', e.target.value)}
                    className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                  />
                  <select
                    value={formClass.day ?? ''}
                    onChange={(e) => updateFormClass(index, 'day', e.target.value)}
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
                    value={formClass.timeFrom ?? ''}
                    onChange={(e) => updateFormClass(index, 'timeFrom', e.target.value)}
                    className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                  <input
                    type="time"
                    value={formClass.timeTo ?? ''}
                    onChange={(e) => updateFormClass(index, 'timeTo', e.target.value)}
                    className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="Instructor (optional)"
                    value={formClass.instructor ?? ''}
                    onChange={(e) => updateFormClass(index, 'instructor', e.target.value)}
                    className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    value={formClass.location ?? ''}
                    onChange={(e) => updateFormClass(index, 'location', e.target.value)}
                    className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                {formClasses.length > 1 && (
                  <button
                    onClick={() => removeFormRow(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={addFormRow}
              className="bg-purple-400 hover:bg-purple-500 text-white px-3 py-2 rounded transition-colors text-sm"
            >
              + Add Row
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => (editingId ? saveEdit(editingId) : addAllClasses())}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition-colors font-medium"
            >
              {editingId ? 'Save' : 'Save All'}
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
        {classes.length === 0 ? (
          <div className="text-center py-8 text-gray-700">No classes added yet.</div>
        ) : (
          <div className="space-y-6">
            {getClassesByDay().map(({ day, classes: dayClasses }) => (
              <div key={day} className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{day}</h3>
                
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 mb-2 px-3 py-3 bg-gray-100 rounded-t font-bold text-sm text-gray-700 border-b border-gray-300">
                  <div className="col-span-2">Course</div>
                  <div className="col-span-2">Time</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-2">Instructor</div>
                  <div className="col-span-4 text-center">Actions</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-0 border border-gray-200 rounded-b overflow-hidden">
                  {dayClasses.map((classItem, index) => {
                    const nextClass = dayClasses[index + 1];
                    const currentEndTimeInMinutes = getEndTimeInMinutes(classItem.time);
                    const nextStartTimeInMinutes = nextClass ? getTimeInMinutes(nextClass.time) : 0;
                    const gapMinutes = nextClass && currentEndTimeInMinutes > 0 && nextStartTimeInMinutes > 0
                      ? nextStartTimeInMinutes - currentEndTimeInMinutes
                      : 0;
                    const hasGap = nextClass && gapMinutes > 0;

                    return (
                      <div key={classItem.id}>
                        <div
                          className={`grid grid-cols-12 gap-2 px-3 py-3 items-center border-b transition-all ${
                            classItem.attended
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="col-span-2 font-bold text-purple-600 text-sm">{classItem.className}</div>
                          <div className="col-span-2 text-sm text-gray-700">{formatTime24To12(classItem.time)}</div>
                          <div className="col-span-2 text-sm text-gray-700">{classItem.location || '-'}</div>
                          <div className="col-span-2 text-sm text-gray-700">{classItem.instructor || '-'}</div>
                          <div className="col-span-4 flex items-center justify-center gap-2">
                            <button
                              onClick={() => toggleAttended(classItem.id, classItem.attended)}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                classItem.attended
                                  ? 'bg-green-500 hover:bg-green-600 text-white'
                                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                              }`}
                            >
                              {classItem.attended ? '✓ Attended' : 'Mark Attended'}
                            </button>
                            <button
                              onClick={() => startEdit(classItem)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteClass(classItem.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {hasGap && (
                          <div className="grid grid-cols-12 px-3 py-2 bg-orange-50 border-b border-orange-200 text-xs text-gray-600 font-medium">
                            <div className="col-span-2"></div>
                            <div className="col-span-10">
                              ⏱ Break: {gapMinutes >= 60 ? `${Math.floor(gapMinutes / 60)}h ${gapMinutes % 60}m` : `${gapMinutes}m`}
                            </div>
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
