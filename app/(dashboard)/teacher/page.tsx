import { getTodaySchedule } from '@/app/actions/schedule';
import LiveSchedule from '@/components/LiveSchedule';
import { getCurrentUser } from '@/lib/session';
import CinematicClock from '@/components/CinematicClock';

export default async function TeacherDashboardPage() {
    const user = await getCurrentUser();
    const scheduleData = await getTodaySchedule(); // Logic automatically handles teacher role
    const validSchedule = Array.isArray(scheduleData) ? scheduleData : [];

    return (
        <div className="p-8 space-y-8 animate-fade-in pb-32">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-slate-800 dark:text-white">
                        Welcome, <span className="text-blue-600">Professor {user?.name}</span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Your teaching schedule for today.</p>
                </div>
                <div className="scale-75 origin-right md:scale-90">
                    <CinematicClock variant="card" />
                </div>
            </header>

            {/* Teacher View - Reusing the component as it meets requirements (Now/Next/Timebar) */}
            <LiveSchedule initialSchedule={validSchedule} />
        </div>
    )
}
