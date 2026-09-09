import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../crm.sqlite');

export const db = new DatabaseSync(dbPath);

// Create tables
db.exec(`
  PRAGMA journal_mode = WAL;
  
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    login TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT NOT NULL,
    name TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    clientId TEXT NOT NULL,
    service TEXT NOT NULL,
    description TEXT DEFAULT '',
    amount REAL DEFAULT 0,
    managerId TEXT NOT NULL,
    status TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    cancelReason TEXT DEFAULT '',
    history TEXT DEFAULT '[]',
    brand TEXT DEFAULT '',
    btu TEXT DEFAULT '',
    objectType TEXT DEFAULT '',
    floor TEXT DEFAULT '',
    needLift INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    requestId TEXT NOT NULL,
    title TEXT NOT NULL,
    dueDate INTEGER NOT NULL,
    assigneeId TEXT NOT NULL,
    isDone INTEGER DEFAULT 0
  );
`);

// Safe migrations for existing DB
const runMigration = (sql) => {
  try {
    db.exec(sql);
  } catch {
    // Column already exists or table unchanged
  }
};

runMigration(`ALTER TABLE users ADD COLUMN name TEXT DEFAULT '';`);
runMigration(`ALTER TABLE requests ADD COLUMN brand TEXT DEFAULT '';`);
runMigration(`ALTER TABLE requests ADD COLUMN btu TEXT DEFAULT '';`);
runMigration(`ALTER TABLE requests ADD COLUMN objectType TEXT DEFAULT '';`);
runMigration(`ALTER TABLE requests ADD COLUMN floor TEXT DEFAULT '';`);
runMigration(`ALTER TABLE requests ADD COLUMN needLift INTEGER DEFAULT 0;`);

// Seed default users if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  const insertUser = db.prepare('INSERT INTO users (id, login, password, role, name) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('u1', 'boss', '123', 'boss', 'Руководитель (Босс)');
  insertUser.run('u2', 'manager1', '123', 'manager', 'Алишер (Менеджер)');
  insertUser.run('u3', 'manager2', '123', 'manager', 'Сардор (Монтажник)');
  console.log('[DB] Initial users created: boss, manager1, manager2');
} else {
  // Update names if blank
  db.prepare("UPDATE users SET name = 'Руководитель (Босс)' WHERE id = 'u1' AND (name IS NULL OR name = '')").run();
  db.prepare("UPDATE users SET name = 'Алишер (Менеджер)' WHERE id = 'u2' AND (name IS NULL OR name = '')").run();
  db.prepare("UPDATE users SET name = 'Сардор (Монтажник)' WHERE id = 'u3' AND (name IS NULL OR name = '')").run();
}

// Seed initial clients if empty
const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
if (clientCount === 0) {
  const insertClient = db.prepare('INSERT INTO clients (id, name, phone, address, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  const now = Date.now();
  const day = 86400000;

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

  for (const c of SEED_CLIENTS) {
    insertClient.run(c.id, c.name, c.phone, c.address, c.comment, now - 30 * day);
  }

  const insertRequest = db.prepare(`
    INSERT INTO requests (id, clientId, service, description, amount, managerId, status, createdAt, cancelReason, history, brand, btu, objectType, floor, needLift)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

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

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, requestId, title, dueDate, assigneeId, isDone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

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

  for (const t of SEED_TASKS) {
    insertTask.run(t.id, t.requestId, t.title, t.dueDate, t.assigneeId, t.isDone);
  }

  console.log('[DB] Seeded initial clients, requests with AC details, and tasks.');
}
