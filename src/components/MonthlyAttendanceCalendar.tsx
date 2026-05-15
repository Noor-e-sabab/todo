'use client';

import { useState, useEffect } from 'react';

interface AttendanceData {
  [date: string]: { [classId: string]: boolean };
}

export default function MonthlyAttendanceCalendar() {
  const [attendance, setAttendance] = useState<AttendanceData>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    try {
      const response = await fetch('/api/attendance');
      const data = await response.json();
      setAttendance(data);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getAttendanceForDay = (day: number): { attended: number; total: number } => {
    const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayAttendance = attendance[dateKey] || {};
    const attended = Object.values(dayAttendance).filter(Boolean).length;
    const total = Object.keys(dayAttendance).length;
    return { attended, total };
  };

  const isWeekend = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 5 || dayOfWeek === 6; // Friday and Saturday
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="relative">
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition-colors font-medium text-sm"
        title="View monthly attendance calendar"
      >
        📅 Calendar
      </button>

      {showCalendar && (
        <div className="absolute top-12 left-0 bg-white border-2 border-purple-500 rounded-lg shadow-lg p-4 z-50 w-80">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="text-purple-600 hover:text-purple-800 font-bold"
            >
              ←
            </button>
            <h3 className="text-lg font-bold text-gray-800">{monthName}</h3>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="text-purple-600 hover:text-purple-800 font-bold"
            >
              →
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-600 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-10"></div>;
              }

              const { attended, total } = getAttendanceForDay(day);
              const isWeekendDay = isWeekend(day);
              const isToday = 
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              let bgColor = 'bg-gray-50';
              if (total > 0) {
                if (attended === total) {
                  bgColor = 'bg-green-100'; // All classes attended
                } else if (attended > 0) {
                  bgColor = 'bg-yellow-100'; // Some classes attended
                } else {
                  bgColor = 'bg-red-100'; // No classes attended
                }
              }
              if (isWeekendDay) bgColor = 'bg-gray-100';

              return (
                <div
                  key={day}
                  className={`h-10 flex flex-col items-center justify-center rounded text-xs font-semibold border-2 ${
                    isToday ? 'border-purple-500' : 'border-gray-200'
                  } ${bgColor} cursor-default hover:shadow-md transition-shadow`}
                  title={total > 0 ? `${attended}/${total} classes` : 'No classes'}
                >
                  <span className="text-gray-800">{day}</span>
                  {total > 0 && (
                    <span className="text-xs text-gray-600">
                      {attended}/{total}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 text-xs text-gray-600 space-y-1 border-t pt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-gray-300 rounded"></div>
              <span>All attended</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-gray-300 rounded"></div>
              <span>Partial attendance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-gray-300 rounded"></div>
              <span>No attendance</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
