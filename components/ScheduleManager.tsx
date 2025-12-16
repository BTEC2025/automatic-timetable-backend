'use client'

import { useState } from 'react'

export default function ScheduleManager() {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Schedule Class</h2>
            <form className="space-y-3">
                <input placeholder="Subject" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                <input placeholder="Room" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                <div className="grid grid-cols-2 gap-2">
                    <input type="time" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                    <input type="time" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                </div>
                <button type="button" className="w-full bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700">
                    Add Class
                </button>
            </form>
            <p className="text-xs text-slate-500 text-center">Schedule creation not fully connected in this demo.</p>
        </div>
    )
}
