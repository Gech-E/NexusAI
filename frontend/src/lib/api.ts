/**
 * Centralized API client for Nexus LearnAI.
 * - Injects auth headers automatically
 * - Handles token refresh on 401
 * - Provides typed fetch helpers
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('nexus-auth-storage');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const token = parsed?.state?.accessToken;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // Ignore parse errors
  }
  return {};
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const raw = localStorage.getItem('nexus-auth-storage');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const refreshToken = parsed?.state?.refreshToken;
    if (!refreshToken) return false;

    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    // Update zustand persisted state
    parsed.state.accessToken = data.access_token;
    if (data.refresh_token) {
      parsed.state.refreshToken = data.refresh_token;
    }
    localStorage.setItem('nexus-auth-storage', JSON.stringify(parsed));
    return true;
  } catch {
    return false;
  }
}

async function handleUnauthorized(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise<boolean>((resolve) => {
      refreshQueue.push(() => resolve(true));
    });
  }

  isRefreshing = true;
  const success = await refreshAccessToken();
  isRefreshing = false;

  if (success) {
    refreshQueue.forEach((cb) => cb());
    refreshQueue = [];
    return true;
  }

  // Refresh failed — clear auth and redirect to login
  refreshQueue = [];
  try {
    const raw = localStorage.getItem('nexus-auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.state.user = null;
      parsed.state.accessToken = null;
      parsed.state.refreshToken = null;
      localStorage.setItem('nexus-auth-storage', JSON.stringify(parsed));
    }
  } catch { /* ignore */ }

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
  return false;
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  noAuth?: boolean;
}

/**
 * Main API fetch wrapper.
 * Automatically adds auth headers and handles 401 token refresh.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { body, noAuth, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(body !== undefined && body !== null ? { 'Content-Type': 'application/json' } : {}),
    ...(noAuth ? {} : getAuthHeaders()),
    ...(extraHeaders as Record<string, string> || {}),
  };

  const config: RequestInit = {
    ...rest,
    headers,
    ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
  };

  let res = await fetch(`${API_BASE}${path}`, config);

  // Handle 401 — try refresh
  if (res.status === 401 && !noAuth) {
    const refreshed = await handleUnauthorized();
    if (refreshed) {
      // Retry with new token
      const newHeaders = {
        ...headers,
        ...getAuthHeaders(),
      };
      res = await fetch(`${API_BASE}${path}`, { ...config, headers: newHeaders });
    }
  }

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const errData = await res.json();
      detail = errData.detail || detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

/** Shorthand GET */
export function apiGet<T = unknown>(path: string, options?: ApiOptions) {
  return apiFetch<T>(path, { ...options, method: 'GET' });
}

/** Shorthand POST */
export function apiPost<T = unknown>(path: string, body?: unknown, options?: ApiOptions) {
  return apiFetch<T>(path, { ...options, method: 'POST', body });
}

/** Shorthand PATCH */
export function apiPatch<T = unknown>(path: string, body?: unknown, options?: ApiOptions) {
  return apiFetch<T>(path, { ...options, method: 'PATCH', body });
}

/** Shorthand DELETE */
export function apiDelete<T = unknown>(path: string, options?: ApiOptions) {
  return apiFetch<T>(path, { ...options, method: 'DELETE' });
}

/** Raw URL builder for WebSockets, etc. */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/** WebSocket URL builder */
export function wsUrl(path: string): string {
  const base = API_BASE.replace(/^http/, 'ws');
  return `${base}${path}`;
}
