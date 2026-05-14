import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'public', 'data.json');

export async function loadData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      daily_tasks: [],
      weekly_classes: [],
      monthly_goals: [],
      last_reset: new Date().toISOString().split('T')[0],
    };
  }
}

export async function saveData(data: any) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

export function formatDate(date: Date = new Date()) {
  return date.toISOString().split('T')[0];
}

export function getTodayDate() {
  const today = new Date();
  return today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
