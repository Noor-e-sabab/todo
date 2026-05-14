import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData } from '@/lib/data';

export async function GET() {
  try {
    const data = await loadData();
    return NextResponse.json(data.weekly_classes || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { className, day, time, instructor, location } = await request.json();
    const data = await loadData();

    const newClass = {
      id: Date.now(),
      className,
      day,
      time,
      instructor,
      location,
      attended: false,
    };

    data.weekly_classes.push(newClass);
    await saveData(data);

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}
