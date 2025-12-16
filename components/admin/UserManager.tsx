'use client'

import { useActionState, useState } from 'react'
import { createUser } from '@/app/actions/user'

export default function UserManager() {
    const [state, formAction, isPending] = useActionState(createUser, null)
    const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student')

    return (
        <div>
            <h2 className="font-bold text-lg mb-4">Add New User</h2>
            <form action={formAction} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                    <input
                        name="username"
                        placeholder="student01"
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                    <input
                        name="password"
                        type="password"
                        placeholder="********"
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                    <select
                        name="role"
                        value={role}
                        onChange={(event) => setRole(event.target.value as typeof role)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                {role === 'student' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Student Profile ID</label>
                        <input
                            name="studentId"
                            placeholder="Optional: Student Mongo ID"
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            Link an existing student profile. Leave blank to attach later.
                        </p>
                    </div>
                )}

                {role === 'teacher' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teacher Profile ID</label>
                        <input
                            name="teacherId"
                            placeholder="Optional: Teacher Mongo ID"
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            Provide an existing teacher profile id to link credentials.
                        </p>
                    </div>
                )}

                <button
                    disabled={isPending}
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isPending ? 'Creating...' : 'Create User'}
                </button>

                {state?.error && <p className="text-red-500 text-sm mt-2">{state.error}</p>}
                {state?.success && <p className="text-green-500 text-sm mt-2">{state.success}</p>}
            </form>
        </div>
    )
}
