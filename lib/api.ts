import { cookies } from 'next/headers';

type FetchOptions = RequestInit & {
    auth?: boolean;
};

export type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
    [key: string]: any;
};

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const stripLeadingSlash = (value: string) => value.replace(/^\/+/, '');

export function getApiBaseUrl() {
    const explicit =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_URL ||
        process.env.CSP_SERVICE_URL;

    if (explicit) {
        return stripTrailingSlash(explicit);
    }

    if (process.env.VERCEL_URL) {
        return `https://${stripTrailingSlash(process.env.VERCEL_URL)}`;
    }

    const port = process.env.PORT || '3000';
    return `http://localhost:${port}`;
}

export async function getAuthToken() {
    return (await cookies()).get('authToken')?.value;
}

export async function apiFetch(path: string, init: FetchOptions = {}) {
    const baseUrl = getApiBaseUrl();
    const url = path.startsWith('http')
        ? path
        : `${baseUrl}/${stripLeadingSlash(path)}`;

    const { auth, ...requestInit } = init;
    const headers = new Headers(requestInit.headers);
    const shouldAuthorize = auth ?? true;

    if (shouldAuthorize) {
        const token = getAuthToken();
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
    }

    if (!headers.has('accept')) {
        headers.set('accept', 'application/json');
    }

    const res = await fetch(url, {
        ...requestInit,
        headers,
        cache: requestInit.cache ?? 'no-store',
        next: requestInit.next ?? { revalidate: 0 }
    });

    return res;
}

export async function readJson<T = unknown>(res: Response): Promise<T> {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return (await res.json()) as T;
    }

    const text = await res.text();
    throw new Error(
        `Unexpected response (${res.status}): ${text.slice(0, 200)}`
    );
}
