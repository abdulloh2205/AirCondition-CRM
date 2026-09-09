import { Client, CRMRequest, Task, User } from '../types';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : '/api');

export function getAuthToken(): string | null {
  return typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
}

export function setAuthToken(token: string | null): void {
  if (typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    if (res.status === 401 && !url.includes('/auth/login')) {
      setAuthToken(null);
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

// ==================== AUTH & USERS ====================
export async function loginApi(login: string, password?: string): Promise<{ success: boolean; user: User; token: string }> {
  const data = await request<{ success: boolean; user: User; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function getMeApi(): Promise<{ user: User }> {
  return request<{ user: User }>('/auth/me');
}

export async function getUsersApi(): Promise<User[]> {
  return request<User[]>('/users');
}

export async function createUserApi(user: { login: string; password?: string; role: string; name?: string }): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export async function updateUserApi(id: string, updates: Partial<User>): Promise<User> {
  return request<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteUserApi(id: string): Promise<void> {
  await request(`/users/${id}`, {
    method: 'DELETE',
  });
}

// ==================== CLIENTS ====================
export async function getClientsApi(): Promise<Client[]> {
  return request<Client[]>('/clients');
}

export async function createClientApi(client: Omit<Client, 'id'>): Promise<Client> {
  return request<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  });
}

export async function updateClientApi(id: string, updates: Partial<Client>): Promise<Client> {
  return request<Client>(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteClientApi(id: string): Promise<void> {
  await request(`/clients/${id}`, {
    method: 'DELETE',
  });
}

// ==================== REQUESTS ====================
export async function getRequestsApi(): Promise<CRMRequest[]> {
  return request<CRMRequest[]>('/requests');
}

export async function createRequestApi(req: Omit<CRMRequest, 'id' | 'createdAt'>): Promise<CRMRequest> {
  return request<CRMRequest>('/requests', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function updateRequestApi(id: string, updates: Partial<CRMRequest>): Promise<CRMRequest> {
  return request<CRMRequest>(`/requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteRequestApi(id: string): Promise<void> {
  await request(`/requests/${id}`, {
    method: 'DELETE',
  });
}

// ==================== TASKS ====================
export async function getTasksApi(): Promise<Task[]> {
  return request<Task[]>('/tasks');
}

export async function createTaskApi(task: Omit<Task, 'id'>): Promise<Task> {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

export async function updateTaskApi(id: string, updates: Partial<Task>): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteTaskApi(id: string): Promise<void> {
  await request(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

// ==================== SYSTEM ====================
export async function resetDatabaseApi(): Promise<void> {
  await request('/reset', {
    method: 'POST',
  });
}

export async function getBackupApi(): Promise<any> {
  return request('/backup');
}
