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

function checkConflicts(classes: any[], updatedClass: any, excludeId: number): any {
  for (const existingClass of classes) {
    // Skip the class being edited
    if (existingClass.id === excludeId) {
      continue;
    }

    // Check if same day and times overlap
    if (existingClass.day === updatedClass.day && hasTimeConflict(updatedClass.time, existingClass.time)) {
      return {
        conflicts: true,
        message: `Time conflict with "${existingClass.className}" at ${existingClass.time}`,
      };
    }
  }
  return { conflicts: false };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { className, day, time, instructor, location, attended } = await request.json();
    const data = await loadData();

    const classItem = data.weekly_classes.find((c: any) => c.id === parseInt(id));
    if (!classItem) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Prepare updated class for conflict check
    const updatedClass = {
      day: day || classItem.day,
      time: time || classItem.time,
    };

    // Check for conflicts (if day or time is being changed)
    if (day !== undefined || time !== undefined) {
      const conflict = checkConflicts(data.weekly_classes, updatedClass, parseInt(id));
      if (conflict.conflicts) {
        return NextResponse.json({ error: conflict.message }, { status: 409 });
      }
    }

    classItem.className = className || classItem.className;
    classItem.day = day || classItem.day;
    classItem.time = time || classItem.time;
    classItem.instructor = instructor !== undefined ? instructor : classItem.instructor;
    classItem.location = location !== undefined ? location : classItem.location;
    classItem.attended = attended !== undefined ? attended : classItem.attended;

    await saveData(data);
    return NextResponse.json(classItem);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await loadData();

    data.weekly_classes = data.weekly_classes.filter((c: any) => c.id !== parseInt(id));
    await saveData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
