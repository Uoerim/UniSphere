export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed`);
  return res.json();
}

// Axios-like API wrapper for convenience
const api = {
  get: async <T = unknown>(path: string): Promise<{ data: T }> => {
    const data = await apiGet<T>(path);
    return { data };
  },
  post: async <T = unknown>(path: string, body?: unknown): Promise<{ data: T }> => {
    const data = await apiPost<T>(path, body);
    return { data };
  },
  put: async <T = unknown>(path: string, body?: unknown): Promise<{ data: T }> => {
    const res = await fetch(`${API_URL}${path}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${path} failed`);
    const data = await res.json() as T;
    return { data };
  },
  delete: async <T = unknown>(path: string): Promise<{ data: T }> => {
    const res = await fetch(`${API_URL}${path}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed`);
    const data = await res.json() as T;
    return { data };
  },
};

export default api;
