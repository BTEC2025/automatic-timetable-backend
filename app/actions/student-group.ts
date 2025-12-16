'use server'

import { revalidatePath } from 'next/cache'

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL;

export async function getStudentGroups() {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return [];
        const res = await fetch(`${apiUrl}/api/admin/student-group`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Get student groups error", e);
        return [];
    }
}

export async function createStudentGroup(prevState: any, formData: FormData) {
    const name = formData.get('name') as string;
    const level = formData.get('level') as string;
    const department = formData.get('department') as string;
    const advisor = formData.get('advisor') as string;
    // 'students' count is usually calculated from linked students, or manual input.
    // UI shows students count, but for creation maybe we just create the group.

    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return { error: 'API URL not configured' };

        const res = await fetch(`${apiUrl}/api/admin/student-group`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, level, department, advisor })
        });

        if (!res.ok) {
            return { error: 'Failed to create student group' };
        }

        revalidatePath('/admin/users/groups');
        return { success: 'Group created successfully' };
    } catch (e) {
        return { error: 'Connection Error' };
    }
}

export async function deleteStudentGroup(id: string) {
    try {
        const apiUrl = getApiUrl();
        if (apiUrl) {
            await fetch(`${apiUrl}/api/admin/student-group?id=${id}`, { method: 'DELETE' });
        }
        revalidatePath('/admin/users/groups');
    } catch (e) {
        console.error("Delete group error", e);
    }
}

export async function importStudentGroups(formData: FormData) {
    try {
        const apiUrl = getApiUrl();
        const file = formData.get('file') as File;
        if (!apiUrl || !file) return { error: 'Missing Data' };

        const data = new FormData();
        data.append('file', file);

        const res = await fetch(`${apiUrl}/api/admin/student-group/import`, {
            method: 'POST',
            body: data
        });

        if (res.ok) {
            revalidatePath('/admin/users/groups');
            return { success: 'Import successful' };
        }
        return { error: 'Import failed' };
    } catch (e) {
        return { error: 'Connection Error' };
    }
}
