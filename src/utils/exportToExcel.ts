import { CRMRequest, Client, User } from '../types';
import { format } from 'date-fns';

/**
 * Exports requests to CSV with UTF-8 BOM and semicolon delimiters
 * so Microsoft Excel on Windows opens Russian & Uzbek characters perfectly.
 */
export function exportRequestsToCSV(
  requests: CRMRequest[],
  clients: Client[],
  users: User[],
  filenamePrefix = 'otchet_zayavki'
) {
  const headers = [
    'Номер заявки',
    'Дата создания',
    'Клиент',
    'Телефон',
    'Адрес объекта',
    'Тип услуги',
    'Марка кондиционера',
    'Мощность (BTU)',
    'Тип объекта',
    'Этаж',
    'Автовышка / Альпинист',
    'Сумма (сум)',
    'Ответственный мастер',
    'Статус заявки',
    'Причина отмены'
  ];

  const rows = requests.map(req => {
    const client = clients.find(c => c.id === req.clientId);
    const manager = users.find(u => u.id === req.managerId);
    const dateStr = format(new Date(req.createdAt), 'dd.MM.yyyy HH:mm');

    let serviceStr: string = req.service;
    if (req.service === 'installation') serviceStr = 'Монтаж';
    else if (req.service === 'maintenance') serviceStr = 'ТО / Чистка';
    else if (req.service === 'repair') serviceStr = 'Ремонт';

    let statusStr: string = req.status;
    if (req.status === 'new') statusStr = 'Новая';
    else if (req.status === 'in_progress') statusStr = 'В работе';
    else if (req.status === 'done') statusStr = 'Выполнена';
    else if (req.status === 'cancelled') statusStr = 'Отменена';

    const escapeField = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '';
      const str = String(val);
      if (str.includes(';') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    return [
      escapeField(req.id),
      escapeField(dateStr),
      escapeField(client?.name || 'Не указан'),
      escapeField(client?.phone || ''),
      escapeField(client?.address || ''),
      escapeField(serviceStr),
      escapeField(req.brand || '-'),
      escapeField(req.btu || '-'),
      escapeField(req.objectType || '-'),
      escapeField(req.floor || '-'),
      escapeField(req.needLift ? 'Да' : 'Нет'),
      escapeField(req.amount || 0),
      escapeField(manager?.name || manager?.login || '-'),
      escapeField(statusStr),
      escapeField(req.cancelReason || '')
    ].join(';');
  });

  // UTF-8 BOM ensures Windows Excel doesn't show garbled Cyrillic
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports clients database to CSV for Excel
 */
export function exportClientsToCSV(clients: Client[], requests: CRMRequest[], filenamePrefix = 'baza_klientov') {
  const headers = [
    'ID клиента',
    'ФИО / Название',
    'Телефон',
    'Адрес',
    'Всего заказов',
    'Сумма покупок (сум)',
    'Примечание'
  ];

  const rows = clients.map(client => {
    const clientReqs = requests.filter(r => r.clientId === client.id);
    const doneSum = clientReqs
      .filter(r => r.status === 'done')
      .reduce((acc, r) => acc + (r.amount || 0), 0);

    const escapeField = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '';
      const str = String(val);
      if (str.includes(';') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    return [
      escapeField(client.id),
      escapeField(client.name),
      escapeField(client.phone),
      escapeField(client.address || ''),
      escapeField(clientReqs.length),
      escapeField(doneSum),
      escapeField(client.comment || '')
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
