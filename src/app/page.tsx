import DailyTasks from '@/components/DailyTasks';
import MonthlyGoals from '@/components/MonthlyGoals';
import WeeklyClasses from '@/components/WeeklyClasses';

function getTodayDate() {
  const today = new Date();
  return today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center text-white mb-12 pt-8">
          <h1 className="text-5xl font-bold mb-2 drop-shadow-lg">📋 My To-Do List</h1>
          <p className="text-xl opacity-90">{getTodayDate()}</p>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <DailyTasks />
          <MonthlyGoals />
        </main>

        {/* Weekly Classes - Full Width */}
        <div className="grid grid-cols-1">
          <WeeklyClasses />
        </div>

        {/* Footer */}
        <footer className="text-center text-white mt-12 pb-8">
          <p className="text-lg opacity-90">Stay focused, stay productive! 💪</p>
        </footer>
      </div>
    </div>
  );
}
