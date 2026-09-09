import { Client, CRMRequest, Task, User } from '../types';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : '/api');

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

// ==================== AUTH & USERS ====================
export async function loginApi(login: string, password?: string): Promise<{ success: boolean; user: User }> {
  return request<{ success: boolean; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
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
