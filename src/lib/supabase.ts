import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export function formatDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function getDateString(date?: Date): string {
  const d = date || new Date();
  return d.toISOString().split('T')[0];
}

export interface TaskData {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_date: string;
}

export interface ClassData {
  id: number;
  classname: string;
  day: string;
  time: string;
  instructor: string;
  location: string;
  attended: boolean;
}

export interface GoalData {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_date: string;
}

export interface AttendanceData {
  date: string;
  class_id: number;
  attended: boolean;
}

// Tasks
export async function getTasks(): Promise<TaskData[]> {
  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return data || [];
}

export async function addTask(title: string, description: string): Promise<TaskData | null> {
  const { data, error } = await supabase
    .from('daily_tasks')
    .insert([
      {
        title,
        description,
        completed: false,
        created_date: formatDate(),
      },
    ])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding task:', error);
    return null;
  }
  return data;
}

export async function updateTask(id: number, updates: Partial<TaskData>): Promise<boolean> {
  const { error } = await supabase
    .from('daily_tasks')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating task:', error);
    return false;
  }
  return true;
}

export async function deleteTask(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('daily_tasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting task:', error);
    return false;
  }
  return true;
}

// Classes
export async function getClasses(): Promise<ClassData[]> {
  const { data, error } = await supabase
    .from('weekly_classes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
  return data || [];
}

export async function addClass(classData: Omit<ClassData, 'id'>): Promise<ClassData | null> {
  const { data, error } = await supabase
    .from('weekly_classes')
    .insert([classData])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding class:', error);
    return null;
  }
  return data;
}

export async function updateClass(id: number, updates: Partial<ClassData>): Promise<boolean> {
  const { error } = await supabase
    .from('weekly_classes')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating class:', error);
    return false;
  }
  return true;
}

export async function deleteClass(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('weekly_classes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting class:', error);
    return false;
  }
  return true;
}

// Goals
export async function getGoals(): Promise<GoalData[]> {
  const { data, error } = await supabase
    .from('monthly_goals')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
  return data || [];
}

export async function addGoal(title: string, description: string): Promise<GoalData | null> {
  const { data, error } = await supabase
    .from('monthly_goals')
    .insert([
      {
        title,
        description,
        completed: false,
        created_date: formatDate(),
      },
    ])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding goal:', error);
    return null;
  }
  return data;
}

export async function updateGoal(id: number, updates: Partial<GoalData>): Promise<boolean> {
  const { error } = await supabase
    .from('monthly_goals')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating goal:', error);
    return false;
  }
  return true;
}

export async function deleteGoal(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('monthly_goals')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting goal:', error);
    return false;
  }
  return true;
}

// Attendance
export async function getAttendance(date?: string): Promise<AttendanceData[]> {
  let query = supabase.from('daily_attendance').select('*');
  
  if (date) {
    query = query.eq('date', date);
  }
  
  const { data, error } = await query.order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
  return data || [];
}

export async function addAttendance(date: string, classId: number, attended: boolean): Promise<boolean> {
  // First check if record exists
  const { data: existing } = await supabase
    .from('daily_attendance')
    .select('*')
    .eq('date', date)
    .eq('class_id', classId)
    .single();
  
  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('daily_attendance')
      .update({ attended })
      .eq('date', date)
      .eq('class_id', classId);
    
    if (error) {
      console.error('Error updating attendance:', error);
      return false;
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from('daily_attendance')
      .insert([{ date, class_id: classId, attended }]);
    
    if (error) {
      console.error('Error adding attendance:', error);
      return false;
    }
  }
  
  return true;
}

// Settings
export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  
  if (error) {
    console.error('Error fetching setting:', error);
    return null;
  }
  return data?.value || null;
}

export async function setSetting(key: string, value: string): Promise<boolean> {
  // Try to update first
  const { data: existing } = await supabase
    .from('settings')
    .select('*')
    .eq('key', key)
    .single();
  
  if (existing) {
    const { error } = await supabase
      .from('settings')
      .update({ value })
      .eq('key', key);
    
    if (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('settings')
      .insert([{ key, value }]);
    
    if (error) {
      console.error('Error creating setting:', error);
      return false;
    }
  }
  
  return true;
}
