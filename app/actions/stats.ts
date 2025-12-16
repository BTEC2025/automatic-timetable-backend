'use server'

import { apiFetch, ApiResponse, readJson } from '@/lib/api'

const emptyStats = {
    studentCount: 0,
    teacherCount: 0,
    adminCount: 0,
    totalPopulation: 0
}

type UserRecord = { role: string }

export async function getSchoolStats() {
    try {
        const res = await apiFetch('/api/admin/user?limit=1000')
        if (!res.ok) return emptyStats
        const payload = await readJson<ApiResponse<UserRecord[]>>(res)
        if (!payload.success || !Array.isArray(payload.data)) return emptyStats

        const counts = payload.data.reduce(
            (acc, user) => {
                if (user.role === 'student') acc.studentCount += 1
                else if (user.role === 'teacher') acc.teacherCount += 1
                else if (user.role === 'admin') acc.adminCount += 1
                return acc
            },
            { ...emptyStats }
        )
        counts.totalPopulation = payload.data.length
        return counts
    } catch (error) {
        console.error('Error fetching stats:', error)
        return emptyStats
    }
}
