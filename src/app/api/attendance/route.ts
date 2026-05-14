import { readFile, writeFile } from 'fs/promises';
import path from 'path';

interface Data {
  daily_attendance: { [key: string]: { [key: string]: boolean } };
  last_reset: string;
}

async function readData(): Promise<Data> {
  const filePath = path.join(process.cwd(), 'public', 'data.json');
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

async function writeData(data: Data): Promise<void> {
  const filePath = path.join(process.cwd(), 'public', 'data.json');
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const data = await readData();
    return Response.json(data.daily_attendance || {});
  } catch (error) {
    return Response.json({ error: 'Failed to read attendance' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, classId, attended } = await request.json();

    if (!date || !classId) {
      return Response.json({ error: 'Missing date or classId' }, { status: 400 });
    }

    const data = await readData();

    // Initialize date entry if not exists
    if (!data.daily_attendance) {
      data.daily_attendance = {};
    }
    if (!data.daily_attendance[date]) {
      data.daily_attendance[date] = {};
    }

    // Record attendance for this class on this date
    data.daily_attendance[date][classId] = attended;

    await writeData(data);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
