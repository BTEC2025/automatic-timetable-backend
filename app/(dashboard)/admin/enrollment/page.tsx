'use client'

import { useState } from 'react'
import { BookOpen, Search, CheckCircle2, ChevronRight, Plus, Users, ArrowRight } from 'lucide-react'
import { AnimatedDiv, AnimatedItem } from '@/components/ui/AnimatedList'

// Mock Data
const GROUPS = [
    { id: 1, name: '1 IT 1', department: 'IT' },
    { id: 2, name: '1 IT 2', department: 'IT' },
    { id: 3, name: '2 AC 1', department: 'Accounting' },
]

const SUBJECTS = [
    { id: 1, code: 'CS101', name: 'Intro to Programming' },
    { id: 2, code: 'CS102', name: 'Digital Logic' },
    { id: 3, code: 'MA101', name: 'Calculus I' },
    { id: 4, code: 'EN101', name: 'English' },
]

const INITIAL_ENROLLMENTS = [
    { id: 1, group: '1 IT 1', subjects: ['CS101', 'MA101', 'EN101'] },
    { id: 2, group: '1 IT 2', subjects: ['CS101', 'MA101'] },
]

export default function EnrollmentPage() {
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null)

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        ลงทะเบียนเรียนรายกลุ่ม
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 ml-14">จัดการแผนการเรียนและรายวิชาของแต่ละห้องเรียน</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Groups List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm h-fit">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        เลือกกลุ่มเรียน
                    </h2>
                    <AnimatedDiv className="space-y-2">
                        {GROUPS.map(group => (
                            <AnimatedItem
                                key={group.id}
                            >
                                <button
                                    onClick={() => setSelectedGroup(group.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedGroup === group.id
                                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-semibold ring-1 ring-orange-200 dark:ring-orange-800'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                            {group.department}
                                        </div>
                                        <span>{group.name}</span>
                                    </div>
                                    {selectedGroup === group.id && <ChevronRight className="w-4 h-4" />}
                                </button>
                            </AnimatedItem>
                        ))}
                    </AnimatedDiv>
                </div>

                {/* Right: Enrollment Management */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedGroup ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        รายวิชาที่ลงทะเบียน
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
                                            {GROUPS.find(g => g.id === selectedGroup)?.name}
                                        </span>
                                    </h2>
                                    <p className="text-slate-500 text-sm">จัดการรายวิชาสำหรับเทอมนี้</p>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:transform hover:-translate-y-1 transition-all">
                                    <Plus className="w-4 h-4" />
                                    เพิ่มวิชา
                                </button>
                            </div>

                            <AnimatedDiv className="space-y-3">
                                {INITIAL_ENROLLMENTS.find(e => e.group === GROUPS.find(g => g.id === selectedGroup)?.name)?.subjects.map(subjectCode => {
                                    const subject = SUBJECTS.find(s => s.code === subjectCode)
                                    return (
                                        <AnimatedItem key={subjectCode} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 group hover:border-orange-200 dark:hover:border-orange-900 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                                                    {subject?.code}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 dark:text-white">{subject?.name}</h4>
                                                    <p className="text-xs text-slate-500 font-medium">3 หน่วยกิต • Lecture</p>
                                                </div>
                                            </div>
                                            <button className="text-slate-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                ลบ
                                            </button>
                                        </AnimatedItem>
                                    )
                                }) || (
                                        <div className="text-center py-8 text-slate-500">
                                            ยังไม่ได้ลงทะเบียนรายวิชา
                                        </div>
                                    )}
                            </AnimatedDiv>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                            <ArrowRight className="w-12 h-12 mb-4 opacity-50" />
                            <p>กรุณาเลือกกลุ่มเรียนทางซ้ายมือ</p>
                            <p className="text-sm">เพื่อจัดการรายวิชา</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
