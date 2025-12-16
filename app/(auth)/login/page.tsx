'use client'

import { useActionState, useEffect, useState, startTransition } from 'react'
import { login } from '@/app/actions/auth'
import { Loader2, Mail, Lock, Shield, GraduationCap, User, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

function SubmitButton({ isPending }: { isPending: boolean }) {
    return (
        <button
            type="submit"
            disabled={isPending}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
        >
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>

            <span className="relative flex items-center justify-center gap-2 font-bold tracking-wide">
                {isPending ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>กำลังเข้าสู่ระบบ...</span>
                    </>
                ) : (
                    <>
                        <span>เข้าสู่ระบบ</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </span>
        </button>
    )
}

import FullScreenLoader from '@/components/FullScreenLoader';

// ... (SubmitButton remains the same)

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, null)
    const [email, setEmail] = useState('')
    const [pass, setPass] = useState('')
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false); // New state for full screen loader

    // Reset loading state when server action returns (e.g., on error)
    useEffect(() => {
        if (state) {
            setIsLoggingIn(false);
        }
    }, [state]);

    const fillCreds = (e: string, p: string) => {
        setEmail(e);
        setPass(p);
    }

    const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoggingIn(true);
        const formData = new FormData(e.currentTarget);

        await new Promise(r => setTimeout(r, 2000));

        startTransition(() => {
            formAction(formData);
        });
    }

    return (
        <>
            {/* Show Full Screen Loader if Logging In */}
            {isLoggingIn && <FullScreenLoader />}

            <div className="text-slate-900">
                <div className="text-center mb-10 space-y-3">
                    {/* School Logo */}
                    <div className="inline-flex mb-2">
                        <div className="relative w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Shield className="w-10 h-10 text-white fill-transparent stroke-[2.5]" />
                        </div>
                    </div>


                    <div className="pt-4 space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-black">
                            ลงชื่อเข้าใช้งานระบบสารสนเทศ
                        </h1>
                    </div>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                            อีเมล / รหัสนักศึกษา
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="text"
                                autoComplete="username"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all duration-300"
                                placeholder="name@college.ac.th or Student ID"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                                รหัสผ่าน
                            </label>
                            {/* <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot?</a> */}
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={pass}
                                onChange={(e) => setPass(e.target.value)}
                                className="block w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all duration-300"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 transition-colors focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {state?.error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center justify-center animate-fade-in">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                {state.error}
                            </span>
                        </div>
                    )}

                    <div className="pt-2">
                        <SubmitButton isPending={isPending || isLoggingIn} />
                    </div>
                </form>

                {/* Quick Login - Tech Style */}
                <div className="mt-10">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                            <span className="bg-white/80 px-3 text-slate-400">เมนูลัด</span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                        <button
                            onClick={() => fillCreds('admin@school.edu', '123')}
                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group hover:-translate-y-1"
                        >
                            <Shield className="w-5 h-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-medium text-slate-500 group-hover:text-blue-600 transition-colors">ผู้ดูแลระบบ</span>
                        </button>
                        <button
                            onClick={() => fillCreds('teacher@school.edu', '123')}
                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group hover:-translate-y-1"
                        >
                            <GraduationCap className="w-5 h-5 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-medium text-slate-500 group-hover:text-indigo-600 transition-colors">อาจารย์</span>
                        </button>
                        <button
                            onClick={() => fillCreds('student@school.edu', '123')}
                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group hover:-translate-y-1"
                        >
                            <User className="w-5 h-5 text-sky-500 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-medium text-slate-500 group-hover:text-sky-600 transition-colors">นักศึกษา</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
