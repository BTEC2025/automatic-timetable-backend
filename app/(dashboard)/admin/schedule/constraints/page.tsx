'use client'

import { useState } from 'react'
import { Shield, Lock, Clock, Users, Plus, AlertCircle, RefreshCw } from 'lucide-react'
import { AnimatedDiv, AnimatedItem } from '@/components/ui/AnimatedList'

// Mock Data
const CONSTRAINTS = [
    { id: 1, type: 'Parallel Class', subject: 'Mathematics I', groups: ['1 IT 1', '1 IT 2'], desc: 'ต้องเรียนพร้อมกัน', active: true },
    { id: 2, type: 'Teacher Availability', subject: 'All', teacher: 'อ.สมชาย', desc: 'ไม่ว่างวันจันทร์เช้า', active: true },
]

export default function ConstraintsPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                            <Lock className="w-6 h-6" />
                        </div>
                        เงื่อนไขพิเศษ (Constraints)
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 ml-14">กำหนดกฎเกณฑ์การจัดตารางและเงื่อนไขต่างๆ</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95">
                    <Plus className="w-5 h-5" />
                    <span>เพิ่มเงื่อนไข</span>
                </button>
            </div>

            <AnimatedDiv className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats */}
                <AnimatedItem className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">Active Rules</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">12</h3>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                        <Shield className="w-8 h-8 opacity-80" />
                    </div>
                </AnimatedItem>
                <AnimatedItem className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">Parallel Classes</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">4</h3>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                        <Users className="w-8 h-8 opacity-80" />
                    </div>
                </AnimatedItem>
                <AnimatedItem className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">Time Locks</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">8</h3>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Clock className="w-8 h-8 opacity-80" />
                    </div>
                </AnimatedItem>
            </AnimatedDiv>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">รายการเงื่อนไขทั้งหมด</h3>
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                <AnimatedDiv className="divide-y divide-slate-100 dark:divide-slate-800">
                    {CONSTRAINTS.map(rule => (
                        <AnimatedItem key={rule.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between group">
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 p-2 rounded-lg ${rule.type === 'Parallel Class' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {rule.type === 'Parallel Class' ? <Users className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        {rule.type}
                                        <span className="text-xs font-normal text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                                            Priority: High
                                        </span>
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 font-medium">
                                        {rule.subject} • {rule.desc}
                                    </p>
                                    {rule.groups && (
                                        <div className="flex gap-2 mt-2">
                                            {rule.groups.map(g => (
                                                <span key={g} className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded">
                                                    {g}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-green-600 font-bold">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    Active
                                </div>
                                <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    Edit
                                </button>
                            </div>
                        </AnimatedItem>
                    ))}
                </AnimatedDiv>
            </div>
        </div>
    )
}
