import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData } from '@/lib/data';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { completed } = await request.json();
    const data = await loadData();

    const goal = data.monthly_goals.find((g: any) => g.id === parseInt(id));
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    goal.completed = completed;
    await saveData(data);

    return NextResponse.json(goal);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await loadData();

    data.monthly_goals = data.monthly_goals.filter((g: any) => g.id !== parseInt(id));
    await saveData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
