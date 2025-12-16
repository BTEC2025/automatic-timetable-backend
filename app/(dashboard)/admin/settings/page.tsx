'use client'

import { useState } from 'react'
import { Save, Calendar, Clock, Lock, School } from 'lucide-react'
import { AnimatedDiv, AnimatedItem } from '@/components/ui/AnimatedList'

export default function AdminSettingsPage() {
    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                    ตั้งค่าระบบ
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                    กำหนดและปรับแต่งการทำงานของระบบ
                </p>
            </div>

            {/* Settings Sections */}
            <AnimatedDiv className="space-y-6">

                {/* General Info */}
                <AnimatedItem className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                            <School className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">ข้อมูลสถานศึกษา</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ชื่อสถานศึกษา</label>
                            <input
                                type="text"
                                defaultValue="Technical College"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ปีการศึกษาปัจจุบัน</label>
                            <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
                                <option>2568</option>
                                <option>2567</option>
                            </select>
                        </div>
                    </div>
                </AnimatedItem>

                {/* Semester Configuration */}
                <AnimatedItem className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">ปีการศึกษาและภาคเรียน</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">วันเปิดเทอม</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">วันปิดเทอม</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </AnimatedItem>

                {/* System Defaults */}
                <AnimatedItem className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">เวลาเรียน</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">เวลาเริ่มเรียน (Default)</label>
                            <input
                                type="time"
                                defaultValue="08:00"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">คาบเรียนละ (นาที)</label>
                            <input
                                type="number"
                                defaultValue="60"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </AnimatedItem>

            </AnimatedDiv>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium">
                    ยกเลิก
                </button>
                <button className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all font-medium inline-flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    บันทึกการตั้งค่า
                </button>
            </div>
        </div>
    )
}
