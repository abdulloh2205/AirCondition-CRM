import { v4 as uuidv4 } from 'uuid';
import { Client, CRMRequest, Task, User } from '../types';
import {
  getClientsApi,
  createClientApi,
  updateClientApi,
  deleteClientApi,
  getRequestsApi,
  createRequestApi,
  updateRequestApi,
  deleteRequestApi,
  getTasksApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
  getUsersApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
  resetDatabaseApi
} from '../services/api';
import { Role } from '../types';

const STORAGE_KEY = 'crm_data';
const SEED_KEY = 'crm_seeded_v3';

interface StorageData {
  clients: Client[];
  requests: CRMRequest[];
  tasks: Task[];
  users: User[];
}

const defaultData: StorageData = {
  clients: [],
  requests: [],
  tasks: [],
  users: [
    { id: 'u1', login: 'boss', password: '123', role: 'boss' },
    { id: 'u2', login: 'manager1', password: '123', role: 'manager' },
    { id: 'u3', login: 'manager2', password: '123', role: 'manager' },
  ],
};

let memoryStore: StorageData = (() => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultData;
  try {
    const parsed = JSON.parse(raw) as StorageData;
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = defaultData.users;
    }
    return parsed;
  } catch {
    return defaultData;
  }
})();

function notifyStoreChange() {
  window.dispatchEvent(new CustomEvent('crm_store_updated'));
}

export const getStorageData = (): StorageData => {
  return memoryStore;
};

export const saveStorageData = (data: StorageData) => {
  memoryStore = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  notifyStoreChange();
};

/** Initialize store and sync with SQLite backend */
export const initStoreFromServer = async () => {
  try {
    const [clients, requests, tasks, users] = await Promise.all([
      getClientsApi().catch(() => null),
      getRequestsApi().catch(() => null),
      getTasksApi().catch(() => null),
      getUsersApi().catch(() => null),
    ]);

    let changed = false;
    if (clients && Array.isArray(clients)) {
      memoryStore.clients = clients;
      changed = true;
    }
    if (requests && Array.isArray(requests)) {
      memoryStore.requests = requests;
      changed = true;
    }
    if (tasks && Array.isArray(tasks)) {
      memoryStore.tasks = tasks;
      changed = true;
    }
    if (users && Array.isArray(users) && users.length > 0) {
      memoryStore.users = users;
      changed = true;
    }

    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
      notifyStoreChange();
      console.log('[CRM] Store successfully synchronized with SQLite database.');
    }
  } catch (err) {
    console.warn('[CRM] Could not connect to SQLite backend, using local store:', err);
  }
};

// Automatically sync on startup
if (typeof window !== 'undefined') {
  initStoreFromServer();
}

/** Seed realistic demo data if not already seeded */
export const seedDemoData = () => {
  // Sync with server if possible
  initStoreFromServer();
};

// ==================== CLIENT API ====================
export const getClients = () => memoryStore.clients;

export const addClient = (client: Omit<Client, 'id'>) => {
  const tempId = uuidv4();
  const newClient = { ...client, id: tempId };
  memoryStore.clients.unshift(newClient);
  saveStorageData(memoryStore);

  // Sync with SQLite backend
  createClientApi(client)
    .then((created) => {
      if (created && created.id) {
        const idx = memoryStore.clients.findIndex(c => c.id === tempId);
        if (idx !== -1) {
          memoryStore.clients[idx] = created;
          saveStorageData(memoryStore);
        }
      }
    })
    .catch((err) => {
      console.error('[API] Failed to persist client to backend:', err);
    });

  return newClient;
};

export const updateClient = (id: string, updates: Partial<Client>) => {
  const idx = memoryStore.clients.findIndex(c => c.id === id);
  if (idx !== -1) {
    memoryStore.clients[idx] = { ...memoryStore.clients[idx], ...updates };
    saveStorageData(memoryStore);

    // Sync with SQLite backend
    updateClientApi(id, updates).catch((err) => {
      console.error('[API] Failed to update client in backend:', err);
    });
  }
};

export const deleteClient = (id: string) => {
  memoryStore.clients = memoryStore.clients.filter(c => c.id !== id);
  saveStorageData(memoryStore);

  deleteClientApi(id).catch((err) => {
    console.error('[API] Failed to delete client in backend:', err);
  });
};

export const getClientByPhone = (phone: string, excludeId?: string) => {
  return memoryStore.clients.find(c => c.phone === phone && c.id !== excludeId);
};

// ==================== REQUEST API ====================
export const getRequests = () => memoryStore.requests;

const generateRequestNumber = () => {
  const reqs = memoryStore.requests;
  let max = reqs.length;
  reqs.forEach(r => {
    const n = parseInt(r.id.replace('REQ-', ''));
    if (!isNaN(n) && n > max) max = n;
  });
  return `REQ-${String(max + 1).padStart(4, '0')}`;
};

export const addRequest = (req: Omit<CRMRequest, 'id' | 'createdAt'>) => {
  const tempId = generateRequestNumber();
  const createdAt = Date.now();
  const newReq: CRMRequest = {
    ...req,
    id: tempId,
    createdAt,
    history: [{ date: createdAt, message: 'Заявка создана' }]
  };
  memoryStore.requests.unshift(newReq);
  saveStorageData(memoryStore);

  // Sync with SQLite backend
  createRequestApi(req)
    .then((created) => {
      if (created && created.id) {
        const idx = memoryStore.requests.findIndex(r => r.id === tempId);
        if (idx !== -1) {
          memoryStore.requests[idx] = created;
          saveStorageData(memoryStore);
        }
      }
    })
    .catch((err) => {
      console.error('[API] Failed to persist request to backend:', err);
    });

  return newReq;
};

export const updateRequest = (id: string, updates: Partial<CRMRequest>) => {
  const idx = memoryStore.requests.findIndex(r => r.id === id);
  if (idx !== -1) {
    const current = memoryStore.requests[idx];
    const history = [...(current.history || [])];

    if (updates.status && updates.status !== current.status) {
      history.push({
        date: Date.now(),
        message: `Статус изменен с "${current.status}" на "${updates.status}"`
      });
    }

    memoryStore.requests[idx] = { ...current, ...updates, history };
    saveStorageData(memoryStore);

    // Sync with SQLite backend
    updateRequestApi(id, updates).catch((err) => {
      console.error('[API] Failed to update request in backend:', err);
    });
  }
};

export const deleteRequest = (id: string) => {
  memoryStore.requests = memoryStore.requests.filter(r => r.id !== id);
  memoryStore.tasks = memoryStore.tasks.filter(t => t.requestId !== id);
  saveStorageData(memoryStore);

  deleteRequestApi(id).catch((err) => {
    console.error('[API] Failed to delete request in backend:', err);
  });
};

// ==================== TASK API ====================
export const getTasks = () => memoryStore.tasks;

export const addTask = (task: Omit<Task, 'id'>) => {
  const tempId = uuidv4();
  const newTask = { ...task, id: tempId };
  memoryStore.tasks.push(newTask);
  saveStorageData(memoryStore);

  // Sync with SQLite backend
  createTaskApi(task)
    .then((created) => {
      if (created && created.id) {
        const idx = memoryStore.tasks.findIndex(t => t.id === tempId);
        if (idx !== -1) {
          memoryStore.tasks[idx] = created;
          saveStorageData(memoryStore);
        }
      }
    })
    .catch((err) => {
      console.error('[API] Failed to persist task to backend:', err);
    });

  return newTask;
};

export const updateTask = (id: string, updates: Partial<Task>) => {
  const idx = memoryStore.tasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    memoryStore.tasks[idx] = { ...memoryStore.tasks[idx], ...updates };
    saveStorageData(memoryStore);

    // Sync with SQLite backend
    updateTaskApi(id, updates).catch((err) => {
      console.error('[API] Failed to update task in backend:', err);
    });
  }
};

export const deleteTask = (id: string) => {
  memoryStore.tasks = memoryStore.tasks.filter(t => t.id !== id);
  saveStorageData(memoryStore);

  deleteTaskApi(id).catch((err) => {
    console.error('[API] Failed to delete task in backend:', err);
  });
};

// ==================== USERS API ====================
export const getUsers = () => memoryStore.users;

export const getUserByLogin = (login: string) => {
  return memoryStore.users.find(u => u.login.toLowerCase() === login.toLowerCase());
};

export const addUser = async (user: { login: string; password?: string; role: Role; name?: string }) => {
  const created = await createUserApi(user);
  if (created) {
    memoryStore.users.push(created);
    saveStorageData(memoryStore);
  }
  return created;
};

export const updateUser = async (id: string, updates: Partial<User>) => {
  const updated = await updateUserApi(id, updates);
  if (updated) {
    const idx = memoryStore.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      memoryStore.users[idx] = updated;
      saveStorageData(memoryStore);
    }
  }
  return updated;
};

export const deleteUser = async (id: string) => {
  await deleteUserApi(id);
  memoryStore.users = memoryStore.users.filter(u => u.id !== id);
  saveStorageData(memoryStore);
};

// ==================== DATA MANAGEMENT ====================
export const exportData = () => {
  const data = memoryStore;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crm_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importData = (file: File, onSuccess: () => void, onError: (err: string) => void) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target?.result as string);
      if (parsed && parsed.clients && parsed.requests && parsed.tasks) {
        saveStorageData(parsed);
        onSuccess();
      } else {
        onError('Неверный формат данных');
      }
    } catch {
      onError('Ошибка чтения файла');
    }
  };
  reader.readAsText(file);
};

export const resetToDemoData = async () => {
  try {
    await resetDatabaseApi();
  } catch (err) {
    console.warn('Could not reset database on server:', err);
  }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SEED_KEY);
  await initStoreFromServer();
};
