import { getTodaySchedule } from '@/app/actions/schedule'; // Fixed import path
import LiveSchedule from '@/components/LiveSchedule';
import DownloadScheduleButton from '@/components/DownloadScheduleButton';
import { getCurrentUser } from '@/lib/session';


export default async function StudentDashboardPage() {
    const user = await getCurrentUser();
    const scheduleData = await getTodaySchedule();

    // Handle error if scheduleData is error object
    const validSchedule = Array.isArray(scheduleData) ? scheduleData : [];

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Welcome back, <span className="text-blue-600">{user?.name || 'Student'}</span> 👋
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">
                        Here's what's happening today.
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-900">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-500">Student Dashboard</p>
                </div>
                <div className="md:hidden">
                    {/* Mobile layout adjustment if needed */}
                </div>
            </header>

            <div className="flex justify-end">
                <DownloadScheduleButton scheduleData={validSchedule} />
            </div>

            <LiveSchedule initialSchedule={validSchedule} />
        </div>
    )
}
