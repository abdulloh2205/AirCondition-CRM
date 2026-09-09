export type Role = 'manager' | 'boss';

export interface User {
  id: string;
  login: string;
  password?: string;
  role: Role;
  name?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string;
  comment?: string;
}

export type RequestStatus = 'new' | 'in_progress' | 'done' | 'cancelled';
export type ServiceType = 'installation' | 'maintenance' | 'repair';

export interface CRMRequest {
  id: string; // номер, присваивается автоматически
  clientId: string;
  service: ServiceType;
  description?: string;
  amount: number; // в сумах
  managerId: string; // ответственный
  status: RequestStatus;
  createdAt: number; // timestamp
  cancelReason?: string;
  history?: { date: number; message: string }[];
  brand?: string; // Gree, Artel, Midea, etc.
  btu?: string; // 7 BTU, 9 BTU, 12 BTU, etc.
  objectType?: string; // Квартира, Дом, Офис, etc.
  floor?: string; // Этаж установки
  needLift?: boolean; // Автовышка / альпинист
}

export interface Task {
  id: string;
  requestId: string;
  title: string;
  dueDate: number; // timestamp
  assigneeId: string;
  isDone: boolean;
}
