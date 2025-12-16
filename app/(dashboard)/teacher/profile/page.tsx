'use client'

import { User, Mail, Phone, MapPin, GraduationCap, Award, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TeacherProfilePage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Cover & Profile Header */}
            <div className="relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="h-48 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                </motion.div>

                <div className="px-8 pb-4 relative -mt-20 flex flex-col md:flex-row items-end gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="relative"
                    >
                        <div className="w-40 h-40 rounded-3xl bg-white dark:bg-slate-900 p-2 shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500">
                            <div className="w-full h-full rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                <User className="w-20 h-20 text-slate-400" />
                            </div>
                        </div>
                        <div className="absolute bottom-4 right-4 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full"></div>
                    </motion.div>

                    <div className="flex-1 pb-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">อ.สมชาย ใจดี</h1>
                            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Head of Department • Computer Science</p>

                            <div className="flex flex-wrap gap-4 mt-4">
                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 shadow-sm font-medium">
                                    <Mail className="w-4 h-4 text-blue-500" />
                                    <span>somchai.j@techcollege.ac.th</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 shadow-sm font-medium">
                                    <Phone className="w-4 h-4 text-green-500" />
                                    <span>081-234-5678</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="mb-4 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-lg hover:transform hover:-translate-y-1 transition-all"
                    >
                        Edit Profile
                    </motion.button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="space-y-6"
                >
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                <Award className="w-5 h-5" />
                            </div>
                            Qualifications
                        </h3>
                        <div className="space-y-4">
                            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 pb-1">
                                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900"></div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">Ph.D. Computer Science</h4>
                                <p className="text-sm text-slate-500">Chulalongkorn University</p>
                                <span className="text-xs text-slate-400">2018 - 2022</span>
                            </div>
                            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700">
                                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-900"></div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">M.Sc. IT</h4>
                                <p className="text-sm text-slate-500">Kasetsart University</p>
                                <span className="text-xs text-slate-400">2016 - 2018</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column - Stats/Schedule */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="md:col-span-2 space-y-6"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
                            <div className="flex items-center gap-3 opacity-90 mb-2">
                                <BookOpen className="w-5 h-5" />
                                <span className="font-medium">Total Subjects</span>
                            </div>
                            <div className="text-4xl font-bold">12</div>
                            <div className="mt-2 text-sm opacity-75">Active this semester</div>
                        </div>
                        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/20">
                            <div className="flex items-center gap-3 opacity-90 mb-2">
                                <GraduationCap className="w-5 h-5" />
                                <span className="font-medium">Students</span>
                            </div>
                            <div className="text-4xl font-bold">256</div>
                            <div className="mt-2 text-sm opacity-75">Across all classes</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-lg mb-4">Teaching Preferences</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Programming', 'Database', 'Web Development', 'AI', 'Data Science'].map((tag) => (
                                <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-default">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
