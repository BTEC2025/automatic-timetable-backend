'use client'

import { useState } from 'react'
import { Plus, Calendar, Clock, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { AnimatedDiv, AnimatedItem } from '@/components/ui/AnimatedList'

// Mock Data
const MOCK_REQUESTS = [
    { id: 1, type: 'ลาป่วย', date: '2025-06-15', duration: '1 วัน', reason: 'ไปพบแพทย์', status: 'Approved' },
    { id: 2, type: 'ขอสอนชดเชย', date: '2025-06-20', duration: '2 คาบ', reason: 'ติดภารกิจราชการ', status: 'Pending' },
    { id: 3, type: 'ลากิจ', date: '2025-05-10', duration: '1 วัน', reason: 'ธุระส่วนตัว', status: 'Rejected' },
]

export default function TeacherRequestsPage() {
    const [activeTab, setActiveTab] = useState('all')

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        รายการคำร้อง
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                        ติดตามสถานะและยื่นคำร้องใหม่
                    </p>
                </div>

                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                    <Plus className="w-5 h-5" />
                    <span>เขียนคำร้อง</span>
                </button>
            </div>

            {/* Status Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Request List */}
            <AnimatedDiv className="grid gap-4">
                {MOCK_REQUESTS.map((req) => (
                    <AnimatedItem key={req.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${req.type === 'ลาป่วย' ? 'bg-red-50 text-red-600' :
                                req.type === 'ขอสอนชดเชย' ? 'bg-purple-50 text-purple-600' :
                                    'bg-orange-50 text-orange-600'
                                }`}>
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                                    {req.type}
                                </h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {req.date}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {req.duration}
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg inline-block">
                                    เหตุผล: {req.reason}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${req.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                req.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                {req.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {req.status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                                {req.status === 'Pending' && <AlertCircle className="w-3.5 h-3.5" />}
                                {req.status}
                            </span>
                            <button className="text-sm text-slate-400 hover:text-blue-500 underline decoration-dashed underline-offset-4">
                                ดูรายละเอียด
                            </button>
                        </div>
                    </AnimatedItem>
                ))}
            </AnimatedDiv>
        </div>
    )
}
