import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/gogeo-synapse/us-central1/api';

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    requireAuth?: boolean;
}

/**
 * Base API client for making authenticated requests.
 */
export async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = 'GET', body, requireAuth = true } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Add auth token if required and user is logged in
    if (requireAuth) {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const url = `${API_BASE_URL}/api/v1/meet${endpoint}`;

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.userMessage || `Request failed: ${response.status}`);
    }

    return response.json();
}

/**
 * GET request helper
 */
export function get<T>(endpoint: string, requireAuth = true): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'GET', requireAuth });
}

/**
 * POST request helper
 */
export function post<T>(endpoint: string, body: unknown, requireAuth = true): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'POST', body, requireAuth });
}

/**
 * PATCH request helper
 */
export function patch<T>(endpoint: string, body?: unknown, requireAuth = true): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'PATCH', body, requireAuth });
}

/**
 * DELETE request helper
 */
export function del<T>(endpoint: string, requireAuth = true): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'DELETE', requireAuth });
}
