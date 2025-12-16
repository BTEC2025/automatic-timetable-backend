'use server'

import { revalidatePath } from 'next/cache'

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL;

export async function getSubjects() {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return [];
        const res = await fetch(`${apiUrl}/api/admin/subject`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Get subjects error", e);
        return [];
    }
}

export async function createSubject(prevState: any, formData: FormData) {
    const code = formData.get('code') as string;
    const name = formData.get('name') as string;
    const credits = formData.get('credits') as string;
    const category = formData.get('category') as string; // core, elective, etc.
    // Assuming hours/week might be needed too, but sticking to basics first.

    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return { error: 'API URL not configured' };

        const res = await fetch(`${apiUrl}/api/admin/subject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                name,
                credits: parseInt(credits),
                category
            })
        });

        if (!res.ok) {
            return { error: 'Failed to create subject' };
        }

        revalidatePath('/admin/courses');
        return { success: 'Subject created successfully' };
    } catch (e) {
        return { error: 'Connection Error' };
    }
}

export async function deleteSubject(id: string) {
    try {
        const apiUrl = getApiUrl();
        if (apiUrl) {
            await fetch(`${apiUrl}/api/admin/subject?id=${id}`, { method: 'DELETE' });
        }
        revalidatePath('/admin/courses');
    } catch (e) {
        console.error("Delete subject error", e);
    }
}

export async function importSubjects(formData: FormData) {
    try {
        const apiUrl = getApiUrl();
        const file = formData.get('file') as File;
        if (!apiUrl || !file) return { error: 'Missing Data' };

        const data = new FormData();
        data.append('file', file);

        const res = await fetch(`${apiUrl}/api/admin/subject/import`, {
            method: 'POST',
            body: data
        });

        if (res.ok) {
            revalidatePath('/admin/courses');
            return { success: 'Import successful' };
        }
        return { error: 'Import failed' };
    } catch (e) {
        return { error: 'Connection Error' };
    }
}
