'use client'

import { useActionState } from 'react'
import { createSchedule } from '@/app/actions/schedule'

export default function ScheduleManager() {
    const [state, formAction, isPending] = useActionState(createSchedule, null)

    return (
        <div>
            <h2 className="font-bold text-lg mb-4">Add Scheduled Class</h2>
            <p className="text-xs text-slate-500 mb-4">
                Use dataset codes/IDs for each field. These map directly to the values stored in MongoDB documents.
            </p>
            <form action={formAction} className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Group Code</label>
                    <input
                        name="group_id"
                        placeholder="e.g. M4A"
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject Code</label>
                    <input
                        name="subject_id"
                        placeholder="SUB-101"
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teacher Code</label>
                    <input
                        name="teacher_id"
                        placeholder="TCH-01"
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Room Code</label>
                    <input
                        name="room_id"
                        placeholder="RM-401"
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Timeslot ID</label>
                    <input
                        name="timeslot_id"
                        placeholder="Timeslot Mongo ID"
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Copy the _id from the Timeslot collection.</p>
                </div>

                <button
                    disabled={isPending}
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isPending ? 'Saving...' : 'Add Entry'}
                </button>

                {state?.error && <p className="text-red-500 text-sm mt-2">{state.error}</p>}
                {state?.success && <p className="text-green-500 text-sm mt-2">{state.success}</p>}
            </form>
        </div>
    )
}
