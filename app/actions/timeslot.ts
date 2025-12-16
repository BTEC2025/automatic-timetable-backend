'use server'

import { revalidatePath } from 'next/cache'

const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL;
};

export async function getTimeslots() {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return [];

        const res = await fetch(`${apiUrl}/api/admin/timeslot`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Error fetching timeslots:", error);
        return [];
    }
}

export async function createTimeslot(formData: FormData) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return { error: 'API URL not set' };

        const rawData = Object.fromEntries(formData.entries());
        // User hasn't provided payload structure, but we can assume standard fields or just pass what we have.
        // Or if it is import, it's specific.
        // For basic create, we'll send JSON.

        const res = await fetch(`${apiUrl}/api/admin/timeslot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rawData)
        });

        if (res.ok) {
            revalidatePath('/admin/settings'); // Assuming it's in settings
            return { success: 'Timeslot created successfully' };
        }
        return { error: 'Failed to create timeslot' };
    } catch (error) {
        console.error("Error creating timeslot:", error);
        return { error: 'Connection Error' };
    }
}

export async function deleteTimeslot(id: string) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return { error: 'API URL not set' };

        const res = await fetch(`${apiUrl}/api/admin/timeslot?id=${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            revalidatePath('/admin/settings');
            return { success: 'Timeslot deleted successfully' };
        }
        return { error: 'Failed to delete timeslot' };
    } catch (error) {
        console.error("Error deleting timeslot:", error);
        return { error: 'Connection Error' };
    }
}

export async function editTimeslot(formData: FormData) {
    try {
        const apiUrl = getApiUrl();
        const id = formData.get('id');
        if (!apiUrl || !id) return { error: 'Missing Data' };

        const rawData = Object.fromEntries(formData.entries());

        const res = await fetch(`${apiUrl}/api/admin/timeslot?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rawData)
        });

        if (res.ok) {
            revalidatePath('/admin/settings');
            return { success: 'Timeslot updated successfully' };
        }
        return { error: 'Failed to update timeslot' };
    } catch (error) {
        console.error("Error updating timeslot:", error);
        return { error: 'Connection Error' };
    }
}

export async function importTimeslots(formData: FormData) {
    try {
        const apiUrl = getApiUrl();
        const file = formData.get('file') as File;
        if (!apiUrl || !file) return { error: 'Missing Data' };

        const data = new FormData();
        data.append('file', file);

        const res = await fetch(`${apiUrl}/api/admin/timeslot/import`, {
            method: 'POST',
            body: data
        });

        if (res.ok) {
            revalidatePath('/admin/settings');
            return { success: 'Import successful' };
        }
        return { error: 'Import failed' };
    } catch (e) {
        return { error: 'Connection Error' };
    }
}
