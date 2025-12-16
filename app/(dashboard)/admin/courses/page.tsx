'use client'

import { useState } from 'react'
import { BookOpen, Plus, Search, MoreHorizontal, PenSquare, Trash2, Filter } from 'lucide-react'
import { motion } from 'framer-motion'

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

import { getSubjects, deleteSubject } from '@/app/actions/subject'

export default function CoursesPage() {
    const [courses, setCourses] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    // Fetch subjects on mount
    import('react').then(React => {
        React.useEffect(() => {
            getSubjects().then(data => {
                setCourses(Array.isArray(data) ? data : [])
            })
        }, [])
    })

    const filteredCourses = courses.filter(course =>
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        รายวิชาเรียน (Subjects)
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 ml-14 font-medium">จัดการข้อมูลรายวิชาและหลักสูตร</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                    <Plus className="w-5 h-5" />
                    <span>เพิ่มรายวิชา</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="ค้นหารหัสวิชา หรือ ชื่อวิชา..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium inline-flex items-center gap-2 transition-colors">
                        <Filter className="w-4 h-4" />
                        <span>หมวดหมู่</span>
                    </button>
                    <button className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium inline-flex items-center gap-2 transition-colors">
                        <Filter className="w-4 h-4" />
                        <span>แผนกวิชา</span>
                    </button>
                </div>
            </div>

            {/* Courses Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 w-32">รหัสวิชา</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">ชื่อวิชา</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-center w-24">หน่วยกิต</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 w-32">ประเภท</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">แผนกวิชา</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-center w-24">จัดการ</th>
                            </tr>
                        </thead>
                        <motion.tbody
                            className="divide-y divide-slate-100 dark:divide-slate-800"
                            variants={container}
                            initial="hidden"
                            animate="show"
                        >
                            {filteredCourses.map((course) => (
                                <motion.tr
                                    key={course.id}
                                    variants={item}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                            {course.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        {course.name}
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                                        {course.credit}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${course.category === 'Lecture'
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                            }`}>
                                            {course.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {course.department}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                                                <PenSquare className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                </div>
                {filteredCourses.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-900 dark:text-white font-medium">ไม่พบรายวิชา</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ลองเปลี่ยนคำค้นหา หรือเพิ่มรายวิชาใหม่</p>
                    </div>
                )}
            </div>
        </div>
    );
}
