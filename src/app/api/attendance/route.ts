import { NextRequest, NextResponse } from 'next/server';
import { getAttendance, addAttendance } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const attendance = await getAttendance();
    
    // Transform the data to match the expected format
    const result: { [date: string]: { [classId: string]: boolean } } = {};
    
    for (const record of attendance) {
      if (!result[record.date]) {
        result[record.date] = {};
      }
      result[record.date][record.class_id.toString()] = record.attended;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error loading attendance:', error);
    return NextResponse.json({ error: 'Failed to load attendance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, classId, attended } = await request.json();

    if (!date || !classId) {
      return NextResponse.json({ error: 'Missing date or classId' }, { status: 400 });
    }

    const success = await addAttendance(date, parseInt(classId), attended);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
