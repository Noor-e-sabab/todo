import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData } from '@/lib/data';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { completed, title, description } = await request.json();
    const data = await loadData();

    const task = data.daily_tasks.find((t: any) => t.id === parseInt(id));
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (completed !== undefined) task.completed = completed;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;

    await saveData(data);

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await loadData();

    data.daily_tasks = data.daily_tasks.filter((t: any) => t.id !== parseInt(id));
    await saveData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
