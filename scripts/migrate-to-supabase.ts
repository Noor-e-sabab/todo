import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://ahwodvhtnhkscpwbhbzq.supabase.co';
const supabaseKey = 'sb_publishable_QSJ9b30xnrjw1_yl0CIaGg_fs8ERSXn';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_date: string;
}

interface Class {
  id: number;
  className: string;
  day: string;
  time: string;
  instructor: string;
  location: string;
  attended: boolean;
}

interface Goal {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_date: string;
}

interface AttendanceData {
  [date: string]: { [classId: string]: boolean };
}

interface Settings {
  [key: string]: string;
}

async function migrateData() {
  try {
    console.log('🚀 Starting data migration to Supabase...\n');

    // Read current JSON data
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);

    // 1. Migrate Daily Tasks (without IDs - let Supabase auto-generate)
    console.log('📝 Migrating Daily Tasks...');
    if (data.daily_tasks && Array.isArray(data.daily_tasks) && data.daily_tasks.length > 0) {
      let taskCount = 0;
      for (const task of data.daily_tasks) {
        const { error } = await supabase.from('daily_tasks').insert([
          {
            title: task.title,
            description: task.description,
            completed: task.completed,
            created_date: task.created_date,
          },
        ]);
        if (!error) taskCount++;
      }
      console.log(`✅ Migrated ${taskCount} tasks\n`);
    } else {
      console.log('✅ No tasks to migrate\n');
    }

    // 2. Migrate Weekly Classes (without IDs - will need to match by className for attendance)
    console.log('📚 Migrating Weekly Classes...');
    const classIdMap: { [oldId: number]: number } = {}; // Map old IDs to new IDs
    if (data.weekly_classes && Array.isArray(data.weekly_classes) && data.weekly_classes.length > 0) {
      let classCount = 0;
      for (const cls of data.weekly_classes) {
        const { data: inserted, error } = await supabase
          .from('weekly_classes')
          .insert([
            {
              className: cls.className,
              day: cls.day,
              time: cls.time,
              instructor: cls.instructor,
              location: cls.location,
              attended: cls.attended || false,
            },
          ])
          .select('id');
        if (!error && inserted && inserted.length > 0) {
          classIdMap[cls.id] = inserted[0].id;
          classCount++;
        }
      }
      console.log(`✅ Migrated ${classCount} classes\n`);
    } else {
      console.log('✅ No classes to migrate\n');
    }

    // 3. Migrate Monthly Goals (without IDs - let Supabase auto-generate)
    console.log('🎯 Migrating Monthly Goals...');
    if (data.monthly_goals && Array.isArray(data.monthly_goals) && data.monthly_goals.length > 0) {
      let goalCount = 0;
      for (const goal of data.monthly_goals) {
        const { error } = await supabase.from('monthly_goals').insert([
          {
            title: goal.title,
            description: goal.description,
            completed: goal.completed,
            created_date: goal.created_date,
          },
        ]);
        if (!error) goalCount++;
      }
      console.log(`✅ Migrated ${goalCount} goals\n`);
    } else {
      console.log('✅ No goals to migrate\n');
    }

    // 4. Migrate Daily Attendance (using mapped class IDs)
    console.log('📅 Migrating Daily Attendance...');
    if (data.daily_attendance && typeof data.daily_attendance === 'object') {
      let attendanceCount = 0;
      for (const [date, classes] of Object.entries(data.daily_attendance) as [string, any][]) {
        for (const [classIdStr, attended] of Object.entries(classes)) {
          const oldClassId = parseInt(classIdStr);
          const newClassId = classIdMap[oldClassId];
          
          if (newClassId) {
            const { error } = await supabase.from('daily_attendance').insert([
              {
                date,
                class_id: newClassId,
                attended: Boolean(attended),
              },
            ]);
            if (!error) attendanceCount++;
          }
        }
      }
      console.log(`✅ Migrated ${attendanceCount} attendance records\n`);
    } else {
      console.log('✅ No attendance records to migrate\n');
    }

    // 5. Migrate Settings
    console.log('⚙️ Migrating Settings...');
    let settingsCount = 0;
    if (data.last_reset) {
      const { error } = await supabase.from('settings').insert([
        { key: 'last_reset', value: data.last_reset },
      ]);
      if (!error) settingsCount++;
    }
    if (data.last_task_reset) {
      const { error } = await supabase.from('settings').insert([
        { key: 'last_task_reset', value: data.last_task_reset },
      ]);
      if (!error) settingsCount++;
    }
    console.log(`✅ Migrated ${settingsCount} settings\n`);

    console.log('✨ Migration completed successfully!');
    console.log('Your data is now in Supabase and ready to use.\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData();
