'use server'

import { revalidatePath } from 'next/cache';
import { apiFetch, ApiResponse, readJson } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';

type ActionState = {
    error?: string;
    success?: string;
} | null;

type UserRecord = {
    id: string;
    username: string;
    role: string;
    status: string;
    studentId?: string | null;
    teacherId?: string | null;
};

const defaultError = { error: 'Connection Error' } as ActionState;

export async function createUser(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const username = (formData.get('username') as string)?.trim();
    const password = formData.get('password') as string;
    const role = (formData.get('role') as string) || 'student';
    const studentId = (formData.get('studentId') as string)?.trim();
    const teacherId = (formData.get('teacherId') as string)?.trim();

    if (!username || !password) {
        return { error: 'Username and password are required' };
    }

    try {
        const payload: Record<string, unknown> = { username, password, role };
        if (role === 'student' && studentId) payload.studentId = studentId;
        if (role === 'teacher' && teacherId) payload.teacherId = teacherId;

        const res = await apiFetch('/api/admin/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await readJson<ApiResponse<UserRecord>>(res);
        if (!res.ok || !data.success) {
            return { error: data.message || 'Failed to create user' };
        }

        revalidatePath('/admin/users');
        return { success: 'User created successfully' };
    } catch (error) {
        console.error('createUser error', error);
        return defaultError;
    }
}

export async function editUser(formData: FormData) {
    const id = formData.get('id') as string;
    if (!id) return { error: 'User id is required' };

    const updates: Record<string, unknown> = {};
    const username = (formData.get('username') as string)?.trim();
    const password = formData.get('password') as string;
    const status = (formData.get('status') as string)?.trim();

    if (username) updates.username = username;
    if (password) updates.password = password;
    if (status) updates.status = status;

    if (!Object.keys(updates).length) {
        return { error: 'Nothing to update' };
    }

    try {
        const res = await apiFetch(`/api/admin/user?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        const payload = await readJson<ApiResponse<UserRecord>>(res);
        if (!res.ok || !payload.success) {
            return { error: payload.message || 'Failed to update user' };
        }

        revalidatePath('/admin/users');
        return { success: 'User updated successfully' };
    } catch (error) {
        console.error('editUser error', error);
        return defaultError;
    }
}

export async function updateProfile(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const desiredUsername = (formData.get('name') as string)?.trim();
    if (!desiredUsername) return { error: 'Name is required' };

    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return { error: 'You must be signed in' };

        const res = await apiFetch(`/api/admin/user?id=${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: desiredUsername })
        });

        const payload = await readJson<ApiResponse<UserRecord>>(res);
        if (!res.ok || !payload.success) {
            return { error: payload.message || 'Failed to update profile' };
        }

        revalidatePath('/student/profile');
        revalidatePath('/teacher/profile');
        return { success: 'Profile updated successfully' };
    } catch (error) {
        console.error('updateProfile error', error);
        return defaultError;
    }
}

export async function getUsers() {
    try {
        const res = await apiFetch('/api/admin/user?limit=500');
        if (!res.ok) return [];
        const payload = await readJson<ApiResponse<UserRecord[]>>(res);
        if (!payload.success) return [];
        return Array.isArray(payload.data) ? payload.data : [];
    } catch (err) {
        console.error('Error fetching users:', err);
        return [];
    }
}

export async function deleteUser(id: string) {
    if (!id) return;
    try {
        await apiFetch(`/api/admin/user?id=${id}`, { method: 'DELETE' });
        revalidatePath('/admin/users');
    } catch (err) {
        console.error('Error deleting user:', err);
    }
}

export async function importTeachers(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) return { error: 'File is required' };

    try {
        const body = new FormData();
        body.append('file', file);

        const res = await apiFetch('/api/admin/teacher/import', {
            method: 'POST',
            body
        });

        if (res.ok) {
            revalidatePath('/admin/users');
            return { success: 'Import successful' };
        }
        const payload = await readJson<ApiResponse<unknown>>(res);
        return { error: payload.message || 'Import failed' };
    } catch (e) {
        console.error('importTeachers error', e);
        return defaultError;
    }
}
