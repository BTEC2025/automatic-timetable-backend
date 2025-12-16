import { getSchoolStats } from '@/app/actions/stats';
import { Users, GraduationCap, School } from 'lucide-react';

export default async function StatsPage() {
    const stats = await getSchoolStats();

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">School Statistics</h1>
                <p className="text-slate-500 mt-2">Overview of school population.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Students</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.studentCount}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Teachers</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.teacherCount}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                        <School className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Population</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.totalPopulation}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
