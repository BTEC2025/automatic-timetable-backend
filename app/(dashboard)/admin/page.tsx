import { getSchoolStats } from '@/app/actions/stats';
import { getTodaySchedule } from '@/app/actions/schedule';
import LiveSchedule from '@/components/LiveSchedule';
import { Users, Calendar, Shield } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {
    const stats = await getSchoolStats();
    const todaySchedule = await getTodaySchedule();

    return (
        <div className="space-y-8">
            <header className="animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Admin Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">System overview and controls.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cards linking to management pages */}
                <Link href="/admin/users" className="block group animate-in fade-in zoom-in-95 duration-500 delay-100 fill-mode-both">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 transition-all duration-300 group-hover:shadow-xl group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:-translate-y-1">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">Manage Users</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalPopulation} Users</p>
                        </div>
                    </div>
                </Link>

                <Link href="/admin/schedule" className="block group animate-in fade-in zoom-in-95 duration-500 delay-200 fill-mode-both">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 transition-all duration-300 group-hover:shadow-xl group-hover:border-purple-200 dark:group-hover:border-purple-800 group-hover:-translate-y-1">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">Manage Schedule</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">Configure Timetable</p>
                        </div>
                    </div>
                </Link>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 animate-in fade-in zoom-in-95 duration-500 delay-300 fill-mode-both hover:-translate-y-1 transition-transform">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
                        <Shield className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">System Status</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">Online</p>
                    </div>
                </div>
            </div>

            {/* Live Schedule Overview */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Today's Overview</h2>
                <LiveSchedule initialSchedule={todaySchedule} />
            </div>
        </div>
    )
}
