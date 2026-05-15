import { NextRequest, NextResponse } from 'next/server';
import { getGoals, addGoal } from '@/lib/supabase';

export async function GET() {
  try {
    const goals = await getGoals();
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error loading goals:', error);
    return NextResponse.json({ error: 'Failed to load goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();

    const newGoal = await addGoal(title, description);
    
    if (!newGoal) {
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
