import { getSchedules, deleteSchedule } from '@/app/actions/schedule'
import ScheduleManager from '@/components/admin/ScheduleManager'
import { Trash2 } from 'lucide-react'
import { AnimatedTbody, AnimatedTr } from '@/components/ui/AnimatedList'

export default async function ScheduleManagementPage() {
    const schedules = await getSchedules()
    const validSchedules = Array.isArray(schedules) ? schedules : []

    async function deleteScheduleAction(formData: FormData) {
        'use server'
        const id = formData.get('id') as string
        if (id) await deleteSchedule(id)
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                    Schedule Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Configure classes and timetables.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit">
                    <ScheduleManager />
                </div>

                {/* Table */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Group</th>
                                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Day/Time</th>
                                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Subject</th>
                                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Room</th>
                                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Teacher</th>
                                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Action</th>
                            </tr>
                        </thead>
                        <AnimatedTbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {validSchedules.map((cls: any) => (
                                <AnimatedTr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 group">
                                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                                        <div>{cls.group?.name || cls.group?.code}</div>
                                        <div className="text-xs text-slate-500">{cls.subject?.code}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900 dark:text-white">{cls.timeslot?.day || '-'}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {cls.timeslot ? `${cls.timeslot.start} - ${cls.timeslot.end}` : '—'}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-900 dark:text-white">{cls.subject?.name}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400">{cls.room?.name || cls.room?.code}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400">{cls.teacherId || 'Unassigned'}</td>
                                    <td className="p-4">
                                        <form action={deleteScheduleAction}>
                                            <input type="hidden" name="id" value={cls.id} />
                                            <button className="text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </td>
                                </AnimatedTr>
                            ))}
                        </AnimatedTbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
