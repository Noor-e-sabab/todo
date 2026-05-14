import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData } from '@/lib/data';

function parseTime(timeStr: string): number {
  // Parse time format like "14:30" or "2:30PM"
  const match = timeStr.match(/(\d+):(\d+)/);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
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

function hasTimeConflict(newTime: string, existingTime: string): boolean {
  const [newFrom, newTo] = newTime.split('-').map(t => parseTime(t.trim()));
  const [existFrom, existTo] = existingTime.split('-').map(t => parseTime(t.trim()));

  // Check if time ranges overlap
  return newFrom < existTo && newTo > existFrom;
}

function checkConflicts(classes: any[], newClass: any, excludeId?: number): any {
  for (const existingClass of classes) {
    // Skip the class being edited
    if (excludeId && existingClass.id === excludeId) {
      continue;
    }

    // Check if same day and times overlap
    if (existingClass.day === newClass.day && hasTimeConflict(newClass.time, existingClass.time)) {
      return {
        conflicts: true,
        message: `Time conflict with "${existingClass.className}" at ${existingClass.time}`,
      };
    }
  }
  return { conflicts: false };
}

export async function GET() {
  try {
    const data = await loadData();
    return NextResponse.json(data.weekly_classes || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });
  }
}

interface WeeklyClass {
  id: number;
  className: string;
  day: string;
  time: string;
  instructor: string;
  location: string;
  attended: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { className, day, time, instructor, location } = await request.json();
    const data = await loadData();

    const newClass: WeeklyClass = {
      id: Date.now(),
      className,
      day,
      time,
      instructor,
      location,
      attended: false,
    };

    // Check for conflicts
    const conflict = checkConflicts(data.weekly_classes, newClass);
    if (conflict.conflicts) {
      return NextResponse.json({ error: conflict.message }, { status: 409 });
    }
    
    data.weekly_classes.push(newClass);
    await saveData(data);

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}
