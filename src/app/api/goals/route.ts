import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData } from '@/lib/data';

export async function GET() {
  try {
    const data = await loadData();
    return NextResponse.json(data.monthly_goals || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();
    const data = await loadData();

    const newGoal = {
      id: Date.now(),
      title,
      description,
      completed: false,
      created_date: new Date().toISOString().split('T')[0],
    };

    data.monthly_goals.push(newGoal);
    await saveData(data);

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
