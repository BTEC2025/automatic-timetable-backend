'use client'

import { useState } from 'react'
import { Award, TrendingUp, BookOpen, Download } from 'lucide-react'
import { AnimatedDiv, AnimatedItem, AnimatedTbody, AnimatedTr } from '@/components/ui/AnimatedList'

// Mock Data
const MOCK_GRADES = [
    { code: 'CS101', name: 'Introduction to Programming', credit: 3, grade: 'A', semester: '1/2567' },
    { code: 'MA101', name: 'Calculus I', credit: 3, grade: 'B+', semester: '1/2567' },
    { code: 'EN101', name: 'English for Communication', credit: 2, grade: 'A', semester: '1/2567' },
    { code: 'PHY101', name: 'General Physics', credit: 3, grade: 'B', semester: '1/2567' },
    { code: 'CS102', name: 'Digital Logic', credit: 3, grade: 'A', semester: '1/2567' },
]

export default function StudentGradesPage() {
    const calculateGPA = () => {
        let totalPoints = 0
        let totalCredits = 0
        const gradePoints: Record<string, number> = { 'A': 4, 'B+': 3.5, 'B': 3, 'C+': 2.5, 'C': 2, 'D+': 1.5, 'D': 1, 'F': 0 }

        MOCK_GRADES.forEach(course => {
            if (gradePoints[course.grade] !== undefined) {
                totalPoints += gradePoints[course.grade] * course.credit
                totalCredits += course.credit
            }
        })
        return (totalPoints / totalCredits).toFixed(2)
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-500">
                        ผลการเรียน
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                        ตรวจสอบผลการเรียนและเกรดเฉลี่ย
                    </p>
                </div>
                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-all">
                    <Download className="w-5 h-5" />
                    <span>ใบแสดงผลการเรียน (PDF)</span>
                </button>
            </div>

            {/* GPA Card */}
            <AnimatedDiv className="grid md:grid-cols-3 gap-6">
                <AnimatedItem className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2 opacity-90">
                            <Award className="w-6 h-6" />
                            <span className="font-bold text-lg">GPAX</span>
                        </div>
                        <div className="text-5xl font-bold">{calculateGPA()}</div>
                        <p className="mt-2 opacity-75 text-sm">เกรดเฉลี่ยสะสม</p>
                    </div>
                </AnimatedItem>

                <AnimatedItem className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">สถานะทางวิชาการ</h3>
                        <p className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            ปกติ (Normal)
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{MOCK_GRADES.reduce((acc, curr) => acc + curr.credit, 0)}</div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">หน่วยกิตสะสม</p>
                    </div>
                </AnimatedItem>
            </AnimatedDiv>

            {/* Grades Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-teal-500" />
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">ภาคเรียนที่ 1/2567</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">รหัสวิชา</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">ชื่อวิชา</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-center">หน่วยกิต</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-center">เกรด</th>
                            </tr>
                        </thead>
                        <AnimatedTbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {MOCK_GRADES.map((course, index) => (
                                <AnimatedTr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200">{course.code}</td>
                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{course.name}</td>
                                    <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300 font-medium">{course.credit}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-block w-8 h-8 leading-8 rounded-lg font-bold text-sm ${course.grade === 'A' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            course.grade.startsWith('B') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                            {course.grade}
                                        </span>
                                    </td>
                                </AnimatedTr>
                            ))}
                        </AnimatedTbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
