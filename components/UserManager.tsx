'use client'

import { useState } from 'react'

export default function UserManager() {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New User</h2>
            <form className="space-y-3">
                <input placeholder="Name" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                <input placeholder="Email" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                <select className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="button" className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                    Create User
                </button>
            </form>
            <p className="text-xs text-slate-500 text-center">User creation not fully connected in this demo.</p>
        </div>
    )
}
