import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log incoming API requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ==================== AUTH & USERS ====================
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body;
  if (!login) return res.status(400).json({ error: 'Логин обязателен' });

  const user = db.prepare('SELECT id, login, password, role, name FROM users WHERE LOWER(login) = LOWER(?)').get(login);
  if (!user) {
    return res.status(401).json({ error: 'Пользователь не найден' });
  }

  if (user.password && user.password !== password) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, login, role, name FROM users').all();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { login, password = '123', role = 'manager', name = '' } = req.body;
  if (!login) return res.status(400).json({ error: 'Логин обязателен' });

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(login) = LOWER(?)').get(login);
  if (existing) {
    return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
  }

  const id = 'u_' + crypto.randomUUID().slice(0, 8);
  db.prepare(`
    INSERT INTO users (id, login, password, role, name)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, login.trim().toLowerCase(), password, role, name.trim() || login);

  const created = db.prepare('SELECT id, login, role, name FROM users WHERE id = ?').get(id);
  res.status(201).json(created);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Пользователь не найден' });

  const { name, role, password } = req.body;
  const updatedName = name !== undefined ? name.trim() : current.name;
  const updatedRole = role !== undefined ? role : current.role;
  const updatedPass = password !== undefined && password !== '' ? password : current.password;

  db.prepare(`
    UPDATE users
    SET name = ?, role = ?, password = ?
    WHERE id = ?
  `).run(updatedName, updatedRole, updatedPass, id);

  const updated = db.prepare('SELECT id, login, role, name FROM users WHERE id = ?').get(id);
  res.json(updated);
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'u1') {
    return res.status(400).json({ error: 'Главного администратора (boss) нельзя удалить' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true, id });
});

// ==================== CLIENTS ====================
app.get('/api/clients', (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
  res.json(clients);
});

app.post('/api/clients', (req, res) => {
  const { name, phone, address = '', comment = '' } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Имя и телефон обязательны для заполнения' });
  }

  // Check phone uniqueness
  const existing = db.prepare('SELECT id FROM clients WHERE phone = ?').get(phone);
  if (existing) {
    return res.status(400).json({ error: 'Клиент с таким номером телефона уже существует' });
  }

  const newClient = {
    id: crypto.randomUUID(),
    name: name.trim(),
    phone: phone.trim(),
    address: address.trim(),
    comment: comment.trim(),
    created_at: Date.now(),
  };

  db.prepare(`
    INSERT INTO clients (id, name, phone, address, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(newClient.id, newClient.name, newClient.phone, newClient.address, newClient.comment, newClient.created_at);

  res.status(201).json(newClient);
});

app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, address = '', comment = '' } = req.body;

  const current = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Клиент не найден' });

  if (phone) {
    const existing = db.prepare('SELECT id FROM clients WHERE phone = ? AND id != ?').get(phone, id);
    if (existing) {
      return res.status(400).json({ error: 'Этот номер телефона уже привязан к другому клиенту' });
    }
  }

  const updated = {
    name: name !== undefined ? name.trim() : current.name,
    phone: phone !== undefined ? phone.trim() : current.phone,
    address: address !== undefined ? address.trim() : current.address,
    comment: comment !== undefined ? comment.trim() : current.comment,
  };

  db.prepare(`
    UPDATE clients
    SET name = ?, phone = ?, address = ?, comment = ?
    WHERE id = ?
  `).run(updated.name, updated.phone, updated.address, updated.comment, id);

  res.json({ id, ...updated, created_at: current.created_at });
});

app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  res.json({ success: true, id });
});

// ==================== REQUESTS ====================
function parseRequestRow(row) {
  if (!row) return null;
  let history = [];
  try {
    history = JSON.parse(row.history || '[]');
  } catch {
    history = [];
  }
  return {
    ...row,
    needLift: Boolean(row.needLift),
    brand: row.brand || '',
    btu: row.btu || '',
    objectType: row.objectType || '',
    floor: row.floor || '',
    history,
  };
}

app.get('/api/requests', (req, res) => {
  const rows = db.prepare('SELECT * FROM requests ORDER BY createdAt DESC').all();
  res.json(rows.map(parseRequestRow));
});

function generateRequestNumber() {
  const rows = db.prepare('SELECT id FROM requests').all();
  let max = 0;
  for (const r of rows) {
    const n = parseInt(String(r.id).replace('REQ-', ''), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `REQ-${String(max + 1).padStart(4, '0')}`;
}

app.post('/api/requests', (req, res) => {
  const {
    clientId,
    service,
    description = '',
    amount = 0,
    managerId,
    status = 'new',
    cancelReason = '',
    brand = '',
    btu = '',
    objectType = '',
    floor = '',
    needLift = false,
  } = req.body;

  if (!clientId || !service || !managerId) {
    return res.status(400).json({ error: 'Заполните обязательные поля (клиент, услуга, менеджер)' });
  }

  const id = generateRequestNumber();
  const createdAt = Date.now();
  const history = [{ date: createdAt, message: 'Заявка создана' }];

  db.prepare(`
    INSERT INTO requests (id, clientId, service, description, amount, managerId, status, createdAt, cancelReason, history, brand, btu, objectType, floor, needLift)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    clientId,
    service,
    description,
    Number(amount) || 0,
    managerId,
    status,
    createdAt,
    cancelReason,
    JSON.stringify(history),
    brand,
    btu,
    objectType,
    floor,
    needLift ? 1 : 0
  );

  const created = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
  res.status(201).json(parseRequestRow(created));
});

app.put('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Заявка не найдена' });

  const {
    clientId,
    service,
    description,
    amount,
    managerId,
    status,
    cancelReason,
    brand,
    btu,
    objectType,
    floor,
    needLift,
  } = req.body;

  let history = [];
  try {
    history = JSON.parse(current.history || '[]');
  } catch {
    history = [];
  }

  // Record status change in history
  if (status && status !== current.status) {
    history.push({
      date: Date.now(),
      message: `Статус изменен с "${current.status}" на "${status}"`,
    });
  }

  const updated = {
    clientId: clientId !== undefined ? clientId : current.clientId,
    service: service !== undefined ? service : current.service,
    description: description !== undefined ? description : current.description,
    amount: amount !== undefined ? Number(amount) : current.amount,
    managerId: managerId !== undefined ? managerId : current.managerId,
    status: status !== undefined ? status : current.status,
    cancelReason: cancelReason !== undefined ? cancelReason : current.cancelReason,
    brand: brand !== undefined ? brand : current.brand,
    btu: btu !== undefined ? btu : current.btu,
    objectType: objectType !== undefined ? objectType : current.objectType,
    floor: floor !== undefined ? floor : current.floor,
    needLift: needLift !== undefined ? (needLift ? 1 : 0) : current.needLift,
  };

  db.prepare(`
    UPDATE requests
    SET clientId = ?, service = ?, description = ?, amount = ?, managerId = ?, status = ?, cancelReason = ?, history = ?,
        brand = ?, btu = ?, objectType = ?, floor = ?, needLift = ?
    WHERE id = ?
  `).run(
    updated.clientId,
    updated.service,
    updated.description,
    updated.amount,
    updated.managerId,
    updated.status,
    updated.cancelReason,
    JSON.stringify(history),
    updated.brand,
    updated.btu,
    updated.objectType,
    updated.floor,
    updated.needLift,
    id
  );

  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
  res.json(parseRequestRow(row));
});

app.delete('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM tasks WHERE requestId = ?').run(id);
  db.prepare('DELETE FROM requests WHERE id = ?').run(id);
  res.json({ success: true, id });
});

// ==================== TASKS ====================
function parseTaskRow(row) {
  if (!row) return null;
  return {
    ...row,
    isDone: Boolean(row.isDone),
  };
}

app.get('/api/tasks', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY dueDate ASC').all();
  res.json(rows.map(parseTaskRow));
});

app.post('/api/tasks', (req, res) => {
  const { requestId, title, dueDate, assigneeId, isDone = false } = req.body;
  if (!requestId || !title || !dueDate || !assigneeId) {
    return res.status(400).json({ error: 'Все поля задачи обязательны' });
  }

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO tasks (id, requestId, title, dueDate, assigneeId, isDone)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, requestId, title.trim(), Number(dueDate), assigneeId, isDone ? 1 : 0);

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json(parseTaskRow(row));
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Задача не найдена' });

  const { title, dueDate, assigneeId, isDone } = req.body;

  const updated = {
    title: title !== undefined ? title.trim() : current.title,
    dueDate: dueDate !== undefined ? Number(dueDate) : current.dueDate,
    assigneeId: assigneeId !== undefined ? assigneeId : current.assigneeId,
    isDone: isDone !== undefined ? (isDone ? 1 : 0) : current.isDone,
  };

  db.prepare(`
    UPDATE tasks
    SET title = ?, dueDate = ?, assigneeId = ?, isDone = ?
    WHERE id = ?
  `).run(updated.title, updated.dueDate, updated.assigneeId, updated.isDone, id);

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(parseTaskRow(row));
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.json({ success: true, id });
});

// ==================== RESET & BACKUP ====================
app.get('/api/backup', (req, res) => {
  const clients = db.prepare('SELECT * FROM clients').all();
  const requests = db.prepare('SELECT * FROM requests').all().map(parseRequestRow);
  const tasks = db.prepare('SELECT * FROM tasks').all().map(parseTaskRow);
  const users = db.prepare('SELECT id, login, role, name FROM users').all();

  res.json({ clients, requests, tasks, users });
});

app.post('/api/reset', (req, res) => {
  db.exec(`
    DELETE FROM tasks;
    DELETE FROM requests;
    DELETE FROM clients;
  `);

  const now = Date.now();
  const day = 86400000;

  const insertClient = db.prepare('INSERT INTO clients (id, name, phone, address, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  const SEED_CLIENTS = [
    { id: 'c1', name: 'Алишер Каримов', phone: '+998901112233', address: 'Ташкент, Юнусобод, ул. Беруний 14', comment: 'Предпочитает звонки после 18:00' },
    { id: 'c2', name: 'Нилуфар Рашидова', phone: '+998902223344', address: 'Ташкент, Чиланзар, 11-квартал, д.3', comment: '' },
    { id: 'c3', name: 'Бобур Усманов', phone: '+998903334455', address: 'Самарканд, ул. Регистан 7', comment: 'Новостройка, лоджия на юг' },
    { id: 'c4', name: 'Зарина Ахмедова', phone: '+998904445566', address: 'Ташкент, Мирзо-Улугбек, пр. Космонавтов 21', comment: '' },
    { id: 'c5', name: 'Санжар Турсунов', phone: '+998905556677', address: 'Фергана, ул. Мустакиллик 3', comment: 'Нужна чистка раз в квартал' },
    { id: 'c6', name: 'Дилноза Юсупова', phone: '+998906667788', address: 'Ташкент, Яшнабад, ул. Садовая 9', comment: '' },
    { id: 'c7', name: 'Фаррух Назаров', phone: '+998907778899', address: 'Наманган, ул. Навои 18', comment: 'Офис, 3 кондиционера' },
    { id: 'c8', name: 'Мадина Холматова', phone: '+998908889900', address: 'Ташкент, Сергели, кв. 15, д. 7', comment: '' },
    { id: 'c9', name: 'Комилжон Эргашев', phone: '+998909990011', address: 'Андижан, ул. Бабура 22', comment: 'Ремонт Daikin' },
    { id: 'c10', name: 'Шахло Мирзаева', phone: '+998901234567', address: 'Ташкент, Учтепа, ул. Амира Темура 44', comment: 'VIP клиент, гарантийное обслуживание' },
    { id: 'c11', name: 'Ravshan Toshmatov', phone: '+998912345678', address: 'Toshkent, Olmazor, Qo\'yliq ko\'ch. 5', comment: '' },
    { id: 'c12', name: 'Feruza Qosimova', phone: '+998923456789', address: 'Toshkent, Shayxontohur, Navoiy ko\'ch. 12', comment: 'Samsung konditsioner' },
    { id: 'c13', name: 'Murod Xoliqov', phone: '+998934567890', address: 'Buxoro, Mustaqillik xiyoboni 6', comment: '' },
    { id: 'c14', name: 'OOO ТехноОфис', phone: '+998711112222', address: 'Ташкент, ул. Шота Руставели 33, офис 201', comment: 'Корпоративный клиент, счёт-фактура обязательна' },
    { id: 'c15', name: 'Aziz Rahimov', phone: '+998945678901', address: 'Toshkent, Yakkasaroy, Bobur ko\'ch. 8', comment: '' },
  ];
  for (const c of SEED_CLIENTS) insertClient.run(c.id, c.name, c.phone, c.address, c.comment, now - 30 * day);

  const insertRequest = db.prepare('INSERT INTO requests (id, clientId, service, description, amount, managerId, status, createdAt, cancelReason, history, brand, btu, objectType, floor, needLift) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const SEED_REQUESTS = [
    { id: 'REQ-0001', clientId: 'c1', service: 'installation', description: 'Установка сплит-системы в спальне', amount: 850000, managerId: 'u2', status: 'done', createdAt: now - 20 * day, cancelReason: '', brand: 'LG', btu: '12 BTU', objectType: 'Квартира', floor: '3', needLift: 0 },
    { id: 'REQ-0002', clientId: 'c2', service: 'maintenance', description: 'Плановая чистка фильтров, проверка фреона', amount: 200000, managerId: 'u3', status: 'done', createdAt: now - 15 * day, cancelReason: '', brand: 'Artel', btu: '9 BTU', objectType: 'Квартира', floor: '2', needLift: 0 },
    { id: 'REQ-0003', clientId: 'c3', service: 'installation', description: 'Монтаж, прокладка трассы 5 м', amount: 1200000, managerId: 'u2', status: 'in_progress', createdAt: now - 10 * day, cancelReason: '', brand: 'Midea', btu: '18 BTU', objectType: 'Новостройка', floor: '7', needLift: 1 },
    { id: 'REQ-0004', clientId: 'c4', service: 'repair', description: 'Не охлаждает, шумит компрессор', amount: 450000, managerId: 'u3', status: 'in_progress', createdAt: now - 7 * day, cancelReason: '', brand: 'Gree', btu: '12 BTU', objectType: 'Офис', floor: '1', needLift: 0 },
    { id: 'REQ-0005', clientId: 'c5', service: 'maintenance', description: 'Чистка и дезинфекция, замена фильтра', amount: 180000, managerId: 'u2', status: 'new', createdAt: now - 3 * day, cancelReason: '', brand: 'Shivaki', btu: '12 BTU', objectType: 'Дом', floor: '1', needLift: 0 },
    { id: 'REQ-0006', clientId: 'c6', service: 'installation', description: 'Установка на кухню', amount: 720000, managerId: 'u3', status: 'new', createdAt: now - 2 * day, cancelReason: '', brand: 'Gree', btu: '9 BTU', objectType: 'Квартира', floor: '5', needLift: 0 },
    { id: 'REQ-0007', clientId: 'c7', service: 'installation', description: '3 кондиционера в офис', amount: 3600000, managerId: 'u2', status: 'new', createdAt: now - 1 * day, cancelReason: '', brand: 'Haier', btu: '24 BTU', objectType: 'Офис', floor: '4', needLift: 1 },
    { id: 'REQ-0008', clientId: 'c8', service: 'repair', description: 'Течёт конденсат, ошибка E3 на дисплее', amount: 300000, managerId: 'u3', status: 'cancelled', createdAt: now - 12 * day, cancelReason: 'Клиент отказался от ремонта, решил купить новый', brand: 'AUX', btu: '12 BTU', objectType: 'Квартира', floor: '2', needLift: 0 },
    { id: 'REQ-0009', clientId: 'c9', service: 'repair', description: 'Ремонт платы управления', amount: 550000, managerId: 'u2', status: 'done', createdAt: now - 25 * day, cancelReason: '', brand: 'Daikin', btu: '18 BTU', objectType: 'Офис', floor: '2', needLift: 0 },
    { id: 'REQ-0010', clientId: 'c10', service: 'maintenance', description: 'Гарантийное ТО через 6 месяцев после установки', amount: 0, managerId: 'u3', status: 'done', createdAt: now - 30 * day, cancelReason: '', brand: 'Gree', btu: '12 BTU', objectType: 'Дом', floor: '1', needLift: 0 },
    { id: 'REQ-0011', clientId: 'c11', service: 'installation', description: 'O\'rnatish, trassa 3 m', amount: 780000, managerId: 'u2', status: 'in_progress', createdAt: now - 5 * day, cancelReason: '', brand: 'Samsung', btu: '12 BTU', objectType: 'Kvartira', floor: '3', needLift: 0 },
    { id: 'REQ-0012', clientId: 'c12', service: 'repair', description: 'Samsung konditsioner sovutmayapti', amount: 380000, managerId: 'u3', status: 'new', createdAt: now - 1 * day, cancelReason: '', brand: 'Samsung', btu: '9 BTU', objectType: 'Kvartira', floor: '4', needLift: 0 },
    { id: 'REQ-0013', clientId: 'c14', service: 'installation', description: 'Офис 200 кв.м — 5 кассетных блоков, проект вентиляции', amount: 12000000, managerId: 'u2', status: 'in_progress', createdAt: now - 8 * day, cancelReason: '', brand: 'Midea', btu: '36 BTU', objectType: 'Бизнес-центр', floor: '8', needLift: 1 },
    { id: 'REQ-0014', clientId: 'c13', service: 'maintenance', description: 'Yillik texnik xizmat, 2 ta konditsioner', amount: 320000, managerId: 'u3', status: 'done', createdAt: now - 40 * day, cancelReason: '', brand: 'Artel', btu: '12 BTU', objectType: 'Uy', floor: '1', needLift: 0 },
    { id: 'REQ-0015', clientId: 'c15', service: 'installation', description: 'Midea o\'rnatish, 4-qavat', amount: 1350000, managerId: 'u2', status: 'new', createdAt: now, cancelReason: '', brand: 'Midea', btu: '24 BTU', objectType: 'Kvartira', floor: '4', needLift: 1 },
  ];
  for (const r of SEED_REQUESTS) {
    const history = JSON.stringify([{ date: r.createdAt, message: 'Заявка создана' }]);
    insertRequest.run(r.id, r.clientId, r.service, r.description, r.amount, r.managerId, r.status, r.createdAt, r.cancelReason, history, r.brand, r.btu, r.objectType, r.floor, r.needLift);
  }

  const insertTask = db.prepare('INSERT INTO tasks (id, requestId, title, dueDate, assigneeId, isDone) VALUES (?, ?, ?, ?, ?, ?)');
  const SEED_TASKS = [
    { id: 't1', requestId: 'REQ-0003', title: 'Закупить трассу и крепления', dueDate: now + 2 * day, assigneeId: 'u2', isDone: 0 },
    { id: 't2', requestId: 'REQ-0003', title: 'Выезд на монтаж', dueDate: now + 3 * day, assigneeId: 'u2', isDone: 0 },
    { id: 't3', requestId: 'REQ-0004', title: 'Диагностика компрессора', dueDate: now - 1 * day, assigneeId: 'u3', isDone: 0 },
    { id: 't4', requestId: 'REQ-0005', title: 'Выезд на чистку', dueDate: now + 1 * day, assigneeId: 'u2', isDone: 0 },
    { id: 't6', requestId: 'REQ-0007', title: 'Согласование проекта с клиентом', dueDate: now + 1 * day, assigneeId: 'u2', isDone: 0 },
    { id: 't7', requestId: 'REQ-0007', title: 'Закупка 3 кондиционеров Haier', dueDate: now + 2 * day, assigneeId: 'u2', isDone: 0 },
    { id: 't8', requestId: 'REQ-0011', title: 'Yetkazib berish va o\'rnatish', dueDate: now + 2 * day, assigneeId: 'u2', isDone: 0 },
    { id: 't9', requestId: 'REQ-0012', title: 'Diagnostika uchun chiqish', dueDate: now + 1 * day, assigneeId: 'u3', isDone: 0 },
    { id: 't10', requestId: 'REQ-0013', title: 'Сдать проект вентиляции заказчику', dueDate: now - 2 * day, assigneeId: 'u2', isDone: 0 },
    { id: 't11', requestId: 'REQ-0013', title: 'Монтаж первых 2 блоков', dueDate: now + 4 * day, assigneeId: 'u2', isDone: 0 },
    { id: 't12', requestId: 'REQ-0015', title: 'Yetkazib berish', dueDate: now + 3 * day, assigneeId: 'u2', isDone: 0 },
  ];
  for (const t of SEED_TASKS) insertTask.run(t.id, t.requestId, t.title, t.dueDate, t.assigneeId, t.isDone);

  res.json({ success: true, message: 'Данные сброшены к начальным' });
});

// Serve frontend in production if built (e.g. Render all-in-one deploy)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(distPath, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`[SERVER] CRM Backend running on http://localhost:${PORT}`);
  console.log(`[SERVER] SQLite DB connected: crm.sqlite`);
});
