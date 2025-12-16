'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetch, ApiResponse, readJson } from '@/lib/api';

type LoginSuccess = {
    token: string;
    user?: {
        role?: string;
    };
};

export async function login(prevState: any, formData: FormData) {
    const username = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;

    if (!username || !password) {
        return { error: 'Please provide credentials' };
    }

    try {
        const res = await apiFetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            auth: false
        });

        const payload = await readJson<ApiResponse<LoginSuccess>>(res);
        if (!res.ok || !payload.success || !payload.data?.token) {
            return { error: payload.message || 'Login failed' };
        }

        const cookieStore = await cookies();
        cookieStore.set('authToken', payload.data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24
        });

        const role = payload.data.user?.role || 'student';
        cookieStore.set('user_role', role, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24
        });

        if (role === 'admin') redirect('/admin');
        if (role === 'teacher') redirect('/teacher');
        redirect('/student');
    } catch (error) {
        console.error('Login error:', error);
        if ((error as any)?.digest?.startsWith?.('NEXT_REDIRECT')) {
            throw error;
        }
        return { error: 'Unable to reach the server. Please try again.' };
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('authToken');
    cookieStore.delete('user_role');
    redirect('/login');
}
