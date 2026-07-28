import { http, setAccessToken } from '@/api/httpClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const googleAuthUrl = `${API_BASE_URL}/auth/google`;

export async function getCurrentUser() {
    try {
        return await http.get('/profiles/me');
    } catch {
        return null;
    }
}

export async function login(email, password) {
    const data = await http.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    return data.user;
}

export async function register(email, password, full_name) {
    const data = await http.post('/auth/register', { email, password, full_name });
    setAccessToken(data.accessToken);
    return data.user;
}

export async function logout() {
    await http.post('/auth/logout').catch(() => {});
    setAccessToken(null);
}

export async function forgotPassword(email) {
    return http.post('/auth/forgot-password', { email });
}

export async function resetPassword(token, password) {
    return http.post('/auth/reset-password', { token, password });
}

export async function refreshSession() {
    const data = await http.post('/auth/refresh');
    setAccessToken(data.accessToken);
    return data.user;
}
