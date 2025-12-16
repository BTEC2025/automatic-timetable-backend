import { getUsers, deleteUser } from '@/app/actions/user'
import UserManager from '@/components/admin/UserManager'
import { Trash2 } from 'lucide-react'
import { AnimatedTbody, AnimatedTr } from '@/components/ui/AnimatedList'

const roleBadges: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    teacher: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    student: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
}

const statusBadges: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    inactive: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    deleted: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
}

export default async function UsersPage() {
    const users = await getUsers()
    const validUsers = Array.isArray(users) ? users : []

    async function deleteUserAction(formData: FormData) {
        'use server'
        const id = formData.get('id') as string
        if (id) await deleteUser(id)
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    User Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Create, view, and manage system users.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit">
                    <UserManager />
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Username</th>
                                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Role</th>
                                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Status</th>
                                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Linked Profile</th>
                                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Action</th>
                            </tr>
                        </thead>
                        <AnimatedTbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {validUsers.map((user: any) => (
                                <AnimatedTr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 group">
                                    <td className="p-4 font-medium text-slate-900 dark:text-white">{user.username}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${roleBadges[user.role] ?? roleBadges.student}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${statusBadges[user.status] ?? statusBadges.active}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400">
                                        {user.studentId ? `Student #${user.studentId}` :
                                            user.teacherId ? `Teacher #${user.teacherId}` : '—'}
                                    </td>
                                    <td className="p-4">
                                        <form action={deleteUserAction}>
                                            <input type="hidden" name="id" value={user.id} />
                                            <button className="text-slate-400 hover:text-red-500 transition-colors" title="Deactivate user">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </td>
                                </AnimatedTr>
                            ))}
                        </AnimatedTbody>
                    </table>

                    {validUsers.length === 0 && (
                        <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
                            No users found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
