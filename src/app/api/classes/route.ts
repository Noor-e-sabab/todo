import { NextRequest, NextResponse } from 'next/server';
import { getClasses, addClass } from '@/lib/supabase';

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
        message: `Time conflict with "${existingClass.classname}" at ${existingClass.time}`,
      };
    }
  }
  return { conflicts: false };
}

export async function GET() {
  try {
    const classes = await getClasses();
    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error loading classes:', error);
    return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });
  }
}

interface WeeklyClass {
  classname: string;
  day: string;
  time: string;
  instructor: string;
  location: string;
  attended: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { classname, day, time, instructor, location } = await request.json();
    
    const classes = await getClasses();
    
    const newClass: WeeklyClass = {
      classname,
      day,
      time,
      instructor,
      location,
      attended: false,
    };

    // Check for conflicts
    const conflict = checkConflicts(classes, newClass);
    if (conflict.conflicts) {
      return NextResponse.json({ error: conflict.message }, { status: 409 });
    }
    
    const created = await addClass(newClass);
    
    if (!created) {
      return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}
