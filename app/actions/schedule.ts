'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch, ApiResponse, readJson } from '@/lib/api'

type LiveScheduleItem = {
    id: string
    group: { code: string; name?: string | null }
    subject: { code: string; name: string }
    teacherId: string
    room: { code: string; name?: string | null }
    timeslot: { id: string; day: string; start: string; end: string; period: string } | null
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const toTimeslotDay = (date: Date) => {
    const key = weekDays[date.getDay()]
    if (key === 'Sun' || key === 'Sat') return 'Mon'
    return key
}

const mapToLiveSchedule = (item: LiveScheduleItem) => ({
    _id: item.id,
    startTime: item.timeslot?.start ?? '08:00',
    endTime: item.timeslot?.end ?? '09:00',
    subject: item.subject.name,
    room: item.room.name ?? item.room.code,
    teacherId: { name: item.teacherId },
    studentGroup: item.group.name ?? item.group.code
})

export async function getTodaySchedule() {
    try {
        const dayParam = toTimeslotDay(new Date())
        const res = await apiFetch(`/api/schedule?day=${dayParam}`)
        if (!res.ok) return []
        const payload = await readJson<ApiResponse<LiveScheduleItem[]>>(res)
        if (!payload.success || !payload.data) return []
        return payload.data.map(mapToLiveSchedule)
    } catch (error) {
        console.error('Error fetching schedule:', error)
        return []
    }
}

export async function getSchedules() {
    try {
        const res = await apiFetch('/api/schedule')
        if (!res.ok) return []
        const payload = await readJson<ApiResponse<LiveScheduleItem[]>>(res)
        if (!payload.success || !payload.data) return []
        return payload.data
    } catch (err) {
        console.error('Error fetching schedules:', err)
        return []
    }
}

export async function createSchedule(prevState: any, formData: FormData) {
    const group_id = (formData.get('group_id') as string)?.trim()
    const subject_id = (formData.get('subject_id') as string)?.trim()
    const teacher_id = (formData.get('teacher_id') as string)?.trim()
    const room_id = (formData.get('room_id') as string)?.trim()
    const timeslot_id = (formData.get('timeslot_id') as string)?.trim()

    if (!group_id || !subject_id || !teacher_id || !room_id || !timeslot_id) {
        return { error: 'All fields are required' }
    }

    try {
        const res = await apiFetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_id, subject_id, teacher_id, room_id, timeslot_id })
        })

        const payload = await readJson<ApiResponse<{ id: string }>>(res)
        if (!res.ok || !payload.success) {
            return { error: payload.message || 'Failed to create schedule item' }
        }

        revalidatePath('/admin/schedule')
        return { success: 'Schedule item created successfully' }
    } catch (e) {
        console.error('createSchedule error', e)
        return { error: 'Connection Error' }
    }
}

export async function deleteSchedule(id: string) {
    if (!id) return
    try {
        await apiFetch(`/api/schedule?id=${id}`, { method: 'DELETE' })
        revalidatePath('/admin/schedule')
    } catch (err) {
        console.error('Error deleting schedule:', err)
    }
}
