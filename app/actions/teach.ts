'use server'

import { revalidatePath } from 'next/cache'

const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL;
};

export async function getTeaches() {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return [];

        const res = await fetch(`${apiUrl}/api/admin/teach`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Error fetching teaches:", error);
        return [];
    }
}

export async function createTeach(formData: FormData) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return { error: 'API URL not set' };

        const rawData = Object.fromEntries(formData.entries());

        const res = await fetch(`${apiUrl}/api/admin/teach`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rawData)
        });

        if (res.ok) {
            revalidatePath('/admin/schedule'); // Assuming it affects schedule
            return { success: 'Teach assignment created successfully' };
        }
        return { error: 'Failed to create teach assignment' };
    } catch (error) {
        console.error("Error creating teach assignment:", error);
        return { error: 'Connection Error' };
    }
}

export async function deleteTeach(id: string) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return { error: 'API URL not set' };

        const res = await fetch(`${apiUrl}/api/admin/teach?id=${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            revalidatePath('/admin/schedule');
            return { success: 'Teach assignment deleted successfully' };
        }
        return { error: 'Failed to delete teach assignment' };
    } catch (error) {
        console.error("Error deleting teach assignment:", error);
        return { error: 'Connection Error' };
    }
}

export async function editTeach(formData: FormData) {
    try {
        const apiUrl = getApiUrl();
        const id = formData.get('id');
        if (!apiUrl || !id) return { error: 'Missing Data' };

        const rawData = Object.fromEntries(formData.entries());

        const res = await fetch(`${apiUrl}/api/admin/teach?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rawData)
        });

        if (res.ok) {
            revalidatePath('/admin/schedule');
            return { success: 'Teach assignment updated successfully' };
        }
        return { error: 'Failed to update teach assignment' };
    } catch (error) {
        console.error("Error updating teach assignment:", error);
        return { error: 'Connection Error' };
    }
}

export async function importTeaches(formData: FormData) {
    try {
        const apiUrl = getApiUrl();
        const file = formData.get('file') as File;
        if (!apiUrl || !file) return { error: 'Missing Data' };

        const data = new FormData();
        data.append('file', file);

        const res = await fetch(`${apiUrl}/api/admin/teach/import`, {
            method: 'POST',
            body: data
        });

        if (res.ok) {
            revalidatePath('/admin/schedule');
            return { success: 'Import successful' };
        }
        return { error: 'Import failed' };
    } catch (e) {
        return { error: 'Connection Error' };
    }
}
