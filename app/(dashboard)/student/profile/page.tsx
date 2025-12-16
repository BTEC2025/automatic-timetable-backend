'use client'

import { useActionState } from 'react' // React 19
import { updateProfile } from '@/app/actions/user'
import { User as UserIcon, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedDiv, AnimatedItem } from '@/components/ui/AnimatedList'

export default function ProfilePage() {
    const [state, formAction, isPending] = useActionState(updateProfile, null);

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-600 mt-2 font-medium">Manage your personal information</p>
            </header>

            <AnimatedDiv className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <form action={formAction} className="space-y-6">
                    <AnimatedItem className="space-y-4">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <UserIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">Avatar</h3>
                                <p className="text-sm text-slate-600 font-medium">Avatar change not yet supported</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Display Name</label>
                            <input
                                name="name"
                                type="text"
                                placeholder="Your Name" // Ideally retrieve actual current name from server 
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                            />
                        </div>
                    </AnimatedItem>

                    {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
                    {state?.success && <p className="text-green-500 text-sm">{state.success}</p>}

                    <div className="pt-4">
                        <button
                            disabled={isPending}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </AnimatedDiv>
        </div>
    )
}
