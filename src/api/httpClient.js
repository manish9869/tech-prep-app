const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Access token lives in memory only (never localStorage) — an XSS payload that can run JS
// can call the API as the user regardless of where the token sits, but keeping it out of
// storage at least means it can't be exfiltrated by reading storage after the fact and it
// never survives a hard refresh, which the silent /auth/refresh (httpOnly cookie) recovers.
let accessToken = null;

export function setAccessToken(token) {
    accessToken = token;
}

export function getAccessToken() {
    return accessToken;
}

let refreshPromise = null;

async function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        })
            .then(async (res) => {
                if (!res.ok) throw new Error('refresh failed');
                const data = await res.json();
                setAccessToken(data.accessToken);
                return data;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

async function request(path, { method = 'GET', body, isFormData = false, _retried = false } = {}) {
    const headers = {};
    if (!isFormData) headers['Content-Type'] = 'application/json';
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        credentials: 'include',
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });

    if (res.status === 401 && !_retried) {
        try {
            await refreshAccessToken();
            return request(path, { method, body, isFormData, _retried: true });
        } catch {
            setAccessToken(null);
            throw new Error('Session expired, please log in again');
        }
    }

    let data = null;
    const text = await res.text();
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!res.ok) {
        throw new Error((data && data.error) || `Request failed (${res.status})`);
    }
    return data;
}

export const http = {
    get: (path) => request(path),
    post: (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts }),
    patch: (path, body) => request(path, { method: 'PATCH', body }),
    delete: (path) => request(path, { method: 'DELETE' }),
};
