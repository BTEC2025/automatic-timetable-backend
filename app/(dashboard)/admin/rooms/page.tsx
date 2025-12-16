'use client'

import { useState } from 'react'
import { Plus, Search, MapPin, Users, Building, PenSquare, Trash2, Filter } from 'lucide-react'
import { AnimatedDiv, AnimatedItem } from '@/components/ui/AnimatedList'

import { getRooms, deleteRoom } from '@/app/actions/room'

// Mock Data Removed - fetching from API
const INITIAL_ROOMS: any[] = []

export default function AdminRoomsPage() {
    const [rooms, setRooms] = useState(INITIAL_ROOMS)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Fetch rooms on mount
    import('react').then(React => {
        React.useEffect(() => {
            getRooms().then(data => {
                setRooms(Array.isArray(data) ? data : [])
                setLoading(false)
            })
        }, [])
    })

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.building.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                        จัดการห้องเรียน
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                        จัดการข้อมูลห้องเรียนและสถานที่ทั้งหมด
                    </p>
                </div>

                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                    <Plus className="w-5 h-5" />
                    <span>เพิ่มห้องเรียน</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาห้องเรียน / อาคาร..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <button className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    <span>ตัวกรอง</span>
                </button>
            </div>

            {/* Content Grid */}
            <AnimatedDiv className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => (
                    <AnimatedItem key={room.id} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                <PenSquare className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <span className="px-3 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                                {room.type}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                            {room.name}
                        </h3>

                        <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                <Building className="w-4 h-4" />
                                <span>{room.building}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                <Users className="w-4 h-4" />
                                <span>รองรับ {room.capacity} คน</span>
                            </div>
                        </div>
                    </AnimatedItem>
                ))}
            </AnimatedDiv>

            {filteredRooms.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">ไม่พบห้องเรียน</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
                        ลองค้นหาด้วยคำค้นอื่น หรือเพิ่มห้องเรียนใหม่
                    </p>
                </div>
            )}
        </div>
    )
}
