'use server'

import { cookies } from 'next/headers';
import { apiFetch, ApiResponse, readJson } from './api';

export type CurrentUser = {
    id: string;
    username: string;
    role: string;
    status: string;
    student?: {
        id: string;
        student_id: string;
        student_name: string;
    } | null;
    teacher?: {
        id: string;
        teacher_id: string;
        teacher_name: string;
        role: string;
    } | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
    const token = (await cookies()).get('authToken')?.value;
    if (!token) return null;

    try {
        const res = await apiFetch('/api/user');
        if (!res.ok) return null;
        const payload = await readJson<ApiResponse<CurrentUser>>(res);
        if (!payload.success || !payload.data) return null;
        return payload.data;
    } catch (error) {
        console.error('Failed to load current user', error);
        return null;
    }
}

export async function getCachedRole() {
    return (await cookies()).get('user_role')?.value ?? null;
}
