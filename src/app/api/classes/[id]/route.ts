import { NextRequest, NextResponse } from 'next/server';
import { getClasses, updateClass, deleteClass, addAttendance } from '@/lib/supabase';

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
        message: `Time conflict with "${existingClass.classname}" at ${existingClass.time}`,
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
    const { classname, day, time, instructor, location, attended } = await request.json();
    const classId = parseInt(id);
    
    const classes = await getClasses();
    const classItem = classes.find((c: any) => c.id === classId);
    
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
      const conflict = checkConflicts(classes, updatedClass, classId);
      if (conflict.conflicts) {
        return NextResponse.json({ error: conflict.message }, { status: 409 });
      }
    }

    const updates: any = {};
    if (classname !== undefined) updates.classname = classname;
    if (day !== undefined) updates.day = day;
    if (time !== undefined) updates.time = time;
    if (instructor !== undefined) updates.instructor = instructor;
    if (location !== undefined) updates.location = location;
    if (attended !== undefined) {
      updates.attended = attended;
      // Also save to attendance table
      const today = new Date().toISOString().split('T')[0];
      await addAttendance(today, classId, attended);
    }

    const success = await updateClass(classId, updates);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const success = await deleteClass(parseInt(id));
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
