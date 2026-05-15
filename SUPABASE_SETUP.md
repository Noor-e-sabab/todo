# Supabase Database Setup

Run these SQL commands in the Supabase Dashboard SQL Editor to create the required tables.

## 1. Create Daily Tasks Table

```sql
CREATE TABLE IF NOT EXISTS daily_tasks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_tasks_created_date ON daily_tasks(created_date);
```

## 2. Create Weekly Classes Table

```sql
CREATE TABLE IF NOT EXISTS weekly_classes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  classname TEXT NOT NULL,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  instructor TEXT,
  location TEXT,
  attended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weekly_classes_day ON weekly_classes(day);
```

## 3. Create Monthly Goals Table

```sql
CREATE TABLE IF NOT EXISTS monthly_goals (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_monthly_goals_created_date ON monthly_goals(created_date);
```

## 4. Create Daily Attendance Table

```sql
CREATE TABLE IF NOT EXISTS daily_attendance (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date DATE NOT NULL,
  class_id BIGINT NOT NULL,
  attended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, class_id),
  FOREIGN KEY (class_id) REFERENCES weekly_classes(id) ON DELETE CASCADE
);

CREATE INDEX idx_daily_attendance_date ON daily_attendance(date);
CREATE INDEX idx_daily_attendance_class_id ON daily_attendance(class_id);
```

## 5. Create Settings Table

```sql
CREATE TABLE IF NOT EXISTS settings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_key ON settings(key);
```

## 6. Enable Row Level Security (Optional but Recommended)

```sql
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for now, restrict later as needed)
CREATE POLICY "Allow all" ON daily_tasks FOR ALL USING (true);
CREATE POLICY "Allow all" ON weekly_classes FOR ALL USING (true);
CREATE POLICY "Allow all" ON monthly_goals FOR ALL USING (true);
CREATE POLICY "Allow all" ON daily_attendance FOR ALL USING (true);
CREATE POLICY "Allow all" ON settings FOR ALL USING (true);
```

## Steps to Run

1. Go to https://app.supabase.com
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Copy and paste each SQL block above into the editor
5. Click "Run" to execute
6. Wait for success confirmation

After creating tables, run the migration script:
```bash
npx ts-node scripts/migrate-to-supabase.ts
```

This will import all existing data from `public/data.json` into Supabase.
