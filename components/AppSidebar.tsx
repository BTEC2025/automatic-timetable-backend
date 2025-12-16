'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Calendar,
    Users,
    GraduationCap,
    BookOpen,
    Settings,
    LogOut,
    Shield,
    User,
    CalendarDays,
    Lock,
    LifeBuoy,
    Sparkles,
    LayoutGrid
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

const ROLE_CONFIG = {
    admin: {
        label: 'ADMIN',
        icon: Shield,
        routes: [
            { href: '/admin', label: 'ภาพรวม', icon: LayoutDashboard },
            { href: '/admin/users', label: 'จัดการผู้ใช้', icon: Users },
            { href: '/admin/users/groups', label: 'กลุ่มนักเรียน', icon: Users },
            { href: '/admin/enrollment', label: 'ลงทะเบียนเรียน', icon: BookOpen },
            { href: '/admin/schedule/constraints', label: 'เงื่อนไขพิเศษ', icon: Lock },
            { href: '/admin/schedule', label: 'จัดการตารางเรียน', icon: Calendar },
            { href: '/admin/courses', label: 'รายวิชา', icon: BookOpen },
            { href: '/admin/rooms', label: 'ห้องเรียน', icon: LayoutGrid },
            { href: '/admin/settings', label: 'ตั้งค่าระบบ', icon: Settings },
        ]
    },
    teacher: {
        label: 'TEACHER',
        icon: GraduationCap,
        routes: [
            { href: '/teacher', label: 'ตารางสอนของฉัน', icon: Calendar },
            { href: '/teacher/requests', label: 'คำร้อง/ลา', icon: CalendarDays },
            { href: '/teacher/profile', label: 'ข้อมูลส่วนตัว', icon: User },
        ]
    },
    student: {
        label: 'STUDENT',
        icon: BookOpen,
        routes: [
            { href: '/student', label: 'ตารางเรียนของฉัน', icon: Calendar },
            { href: '/student/grades', label: 'ผลการเรียน', icon: GraduationCap },
            { href: '/student/profile', label: 'ข้อมูลส่วนตัว', icon: User },
        ]
    }
} as const;

type Role = keyof typeof ROLE_CONFIG;

export default function AppSidebar({ role }: { role: string }) {
    const pathname = usePathname();
    const validRole = (Object.keys(ROLE_CONFIG).includes(role) ? role : 'student') as Role;
    const config = ROLE_CONFIG[validRole];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-all font-sans">
            {/* Logo Section */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xl">
                        B
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight leading-none">
                            BTC PORTAL
                        </h1>
                        <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1">
                            Academic System
                        </p>
                    </div>
                </div>

                {/* Role Badge - Optional, but keeps context */}
                {/* <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg w-fit border border-slate-100 dark:border-slate-800 flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{config.label}</span>
                </div> */}
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-hide">
                {config.routes.map((route) => {
                    const isActive = pathname === route.href;
                    const Icon = route.icon;
                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 transition-transform", isActive ? "" : "group-hover:scale-110")} />
                            <span>{route.label}</span>
                        </Link>
                    )
                })}

                {/* General Label for visual separation like reference */}
                <div className="mt-6 mb-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    General
                </div>
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-red-500 transition-all duration-200 group"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>ออกจากระบบ</span>
                </button>

            </div>

            {/* Bottom Help Widget */}
            <div className="p-4">
                <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-5 text-white relative overflow-hidden group">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Sparkles className="w-16 h-16 -mr-4 -mt-4 text-white" />
                    </div>

                    <div className="relative z-10">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <LifeBuoy className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-sm mb-1">ศูนย์ช่วยเหลือ</h4>
                        <p className="text-[10px] text-slate-300 mb-3 leading-relaxed">
                            ติดปัญหาการใช้งาน?
                            <br />แจ้งปัญหาได้ตลอด 24 ชม.
                        </p>
                        <button className="w-full py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">
                            แจ้งปัญหา
                        </button>
                    </div>
                </div>

                {/* Sign Out (Hidden here since moved up, or kept as footer? Reference usually has logout in list or bottom) */}
                {/* <div className="mt-2 flex items-center justify-between px-2">
                     <button onClick={() => logout()} className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors">
                        <LogOut className="w-3 h-3" />
                        Log out
                     </button>
                     <span className="text-[10px] text-slate-300">v1.2.0</span>
                </div> */}
            </div>
        </aside>
    )
}
