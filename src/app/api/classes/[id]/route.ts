import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData } from '@/lib/data';

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
