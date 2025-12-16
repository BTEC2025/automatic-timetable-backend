'use server'

import { revalidatePath } from 'next/cache'

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL;

export async function getRooms() {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return [];
        const res = await fetch(`${apiUrl}/api/admin/room`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Get rooms error", e);
        return [];
    }
}

export async function createRoom(prevState: any, formData: FormData) {
    // Guessing payload based on UI: name, building, capacity, type
    const name = formData.get('name') as string;
    const building = formData.get('building') as string;
    const capacity = formData.get('capacity') as string; // might need number conversion
    const type = formData.get('type') as string;

    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return { error: 'API URL not configured' };

        const res = await fetch(`${apiUrl}/api/admin/room`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                building,
                capacity: parseInt(capacity),
                type
            })
        });

        if (!res.ok) {
            const data = await res.json();
            return { error: data.message || 'Failed to create room' };
        }

        revalidatePath('/admin/rooms');
        return { success: 'Room created successfully' };
    } catch (e) {
        return { error: 'Connection Error' };
    }
}

export async function deleteRoom(id: string) {
    try {
        const apiUrl = getApiUrl();
        if (apiUrl) {
            await fetch(`${apiUrl}/api/admin/room?id=${id}`, { method: 'DELETE' });
        }
        revalidatePath('/admin/rooms');
    } catch (e) {
        console.error("Delete room error", e);
    }
}
