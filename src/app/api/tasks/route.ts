import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData, formatDate } from '@/lib/data';

export async function GET() {
  try {
    const data = await loadData();
    return NextResponse.json(data.daily_tasks || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();
    const data = await loadData();

    const newTask = {
      id: Date.now(),
      title,
      description,
      completed: false,
      created_date: formatDate(),
    };

    data.daily_tasks.push(newTask);
    await saveData(data);

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
