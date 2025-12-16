'use client'

import { useState } from 'react'
import { Users, Plus, Search, MoreHorizontal, GraduationCap, Building2 } from 'lucide-react'
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
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 }
}

import { getStudentGroups } from '@/app/actions/student-group'

export default function StudentGroupsPage() {
    const [groups, setGroups] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    // Fetch groups on mount
    import('react').then(React => {
        React.useEffect(() => {
            getStudentGroups().then(data => {
                setGroups(Array.isArray(data) ? data : [])
            })
        }, [])
    })

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.department.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <Users className="w-6 h-6" />
                        </div>
                        กลุ่มนักเรียน (Student Groups)
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 ml-14 font-medium">จัดการข้อมูลห้องเรียนและกลุ่มผู้เรียน</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                    <Plus className="w-5 h-5" />
                    <span>เพิ่มกลุ่มเรียน</span>
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="ค้นหากลุ่มเรียน..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                />
            </div>

            {/* Groups Grid */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {filteredGroups.map((group) => (
                    <motion.div
                        key={group.id}
                        variants={item}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                    >

                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                {group.name.split(' ')[1]}
                            </div>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{group.name}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{group.department}</p>

                        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                                    ระดับชั้น
                                </span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{group.level}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                                    <Users className="w-4 h-4 text-emerald-500" />
                                    จำนวนนักเรียน
                                </span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{group.students} คน</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                                    <Building2 className="w-4 h-4 text-emerald-500" />
                                    ที่ปรึกษา
                                </span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{group.advisor}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

        </div >
    )
}
