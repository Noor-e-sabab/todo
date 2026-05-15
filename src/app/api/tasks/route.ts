import { NextRequest, NextResponse } from 'next/server';
import { getTasks, addTask, formatDate, setSetting, getSetting } from '@/lib/supabase';

export async function GET() {
  try {
    const today = formatDate();
    const lastReset = await getSetting('last_task_reset');
    
    // If it's a new day, reset all tasks
    if (lastReset !== today) {
      // Tasks will be reset by checking created_date on client side
      // Just update the last_task_reset date
      await setSetting('last_task_reset', today);
    }
    
    const tasks = await getTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();
    
    const newTask = await addTask(title, description);
    
    if (!newTask) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
    
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
