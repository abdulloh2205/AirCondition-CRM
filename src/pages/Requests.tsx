import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getRequests, addRequest, updateRequest, getClients, getUsers, getTasks, addTask, updateTask } from '../store';
import { CRMRequest, Client, User, Task } from '../types';
import { Modal } from '../components/Modal';
import { Plus, Search, Edit2, Calendar, DollarSign, CheckCircle2, Clock, LayoutGrid, List, ArrowRight, Check, X, RotateCcw, Wind, Download } from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { formatMoney } from '../utils/formatters';
import { exportRequestsToCSV } from '../utils/exportToExcel';

const AC_BRANDS = ['Gree', 'Artel', 'Midea', 'Shivaki', 'LG', 'AUX', 'Daikin', 'Samsung', 'Haier', 'Chigo', 'Другой'];
const AC_BTU_LIST = ['7 BTU (до 20 м²)', '9 BTU (до 25 м²)', '12 BTU (до 35 м²)', '18 BTU (до 50 м²)', '24 BTU (до 70 м²)', '36 BTU (полупром)'];
const OBJECT_TYPES = ['Квартира', 'Частный дом', 'Офис', 'Магазин / Кафе', 'Новостройка', 'Склад / Производство'];

export const Requests = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  
  const [requests, setRequests] = useState<CRMRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  
  // View mode: 'kanban' or 'table'
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<CRMRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'history'>('info');

  // Form states
  const [clientId, setClientId] = useState('');
  const [service, setService] = useState<'installation'|'maintenance'|'repair'>('installation');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('0');
  const [managerId, setManagerId] = useState(user?.id || '');
  const [status, setStatus] = useState<'new'|'in_progress'|'done'|'cancelled'>('new');
  const [cancelReason, setCancelReason] = useState('');
  
  // AC Specific fields
  const [brand, setBrand] = useState('Gree');
  const [btu, setBtu] = useState('12 BTU (до 35 м²)');
  const [objectType, setObjectType] = useState('Квартира');
  const [floor, setFloor] = useState('2');
  const [needLift, setNeedLift] = useState(false);

  const [error, setError] = useState('');

  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const refreshData = () => {
    let reqs = getRequests();
    if (user?.role === 'manager') {
      reqs = reqs.filter(r => r.managerId === user.id);
    }
    setRequests(reqs.sort((a, b) => b.createdAt - a.createdAt));
    setClients(getClients());
    setUsers(getUsers());
    setAllTasks(getTasks());
  };

  useEffect(() => {
    refreshData();

    const handleOpenModalEvent = () => {
      const stateClient = location.state as { createForClient?: string } | null;
      if (stateClient?.createForClient) {
        handleOpenModal();
        setClientId(stateClient.createForClient);
      } else {
        handleOpenModal();
      }
    };

    window.addEventListener('openRequestModal', handleOpenModalEvent);
    window.addEventListener('crm_store_updated', refreshData);
    return () => {
      window.removeEventListener('openRequestModal', handleOpenModalEvent);
      window.removeEventListener('crm_store_updated', refreshData);
    };
  }, [user, location.state]);

  const handleOpenModal = (req?: CRMRequest) => {
    setError('');
    setActiveTab('info');
    if (req) {
      setEditingReq(req);
      setClientId(req.clientId);
      setService(req.service);
      setDescription(req.description || '');
      setAmount(req.amount.toString());
      setManagerId(req.managerId);
      setStatus(req.status);
      setCancelReason(req.cancelReason || '');
      setBrand(req.brand || 'Gree');
      setBtu(req.btu || '12 BTU (до 35 м²)');
      setObjectType(req.objectType || 'Квартира');
      setFloor(req.floor || '2');
      setNeedLift(Boolean(req.needLift));
    } else {
      setEditingReq(null);
      setClientId(clients.length > 0 ? clients[0].id : '');
      setService('installation');
      setDescription('');
      setAmount('0');
      setManagerId(user?.id || '');
      setStatus('new');
      setCancelReason('');
      setBrand('Gree');
      setBtu('12 BTU (до 35 м²)');
      setObjectType('Квартира');
      setFloor('2');
      setNeedLift(false);
    }
    setIsModalOpen(true);
  };

  const handleQuickStatusChange = (req: CRMRequest, newStatus: CRMRequest['status']) => {
    if (newStatus === 'cancelled') {
      const reason = window.prompt(lang === 'ru' ? 'Укажите причину отмены заявки:' : 'Bekor qilish sababini kiriting:');
      if (reason === null) return;
      updateRequest(req.id, { status: 'cancelled', cancelReason: reason || 'Отменено пользователем' });
    } else {
      updateRequest(req.id, { status: newStatus });
    }
    refreshData();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError(t('requiredField'));
      return;
    }
    const numAmt = parseInt(amount, 10);
    if (numAmt < 0) {
      setError(t('positiveAmount'));
      return;
    }
    if (status === 'cancelled' && !cancelReason.trim()) {
      setError(t('cancelReasonReq'));
      return;
    }

    if (!editingReq) {
      addRequest({
        clientId,
        service,
        description,
        amount: numAmt || 0,
        managerId,
        status,
        cancelReason,
        brand,
        btu,
        objectType,
        floor,
        needLift,
      });
    } else {
      const history = editingReq.history ? [...editingReq.history] : [];
      if (editingReq.status !== status) {
        history.push({ date: Date.now(), message: `Статус изменен: ${editingReq.status} -> ${status}` });
      }

      updateRequest(editingReq.id, {
        clientId,
        service,
        description,
        amount: numAmt || 0,
        managerId,
        status,
        cancelReason,
        history,
        brand,
        btu,
        objectType,
        floor,
        needLift,
      });
      
      if (managerId !== editingReq.managerId) {
        allTasks.filter(t => t.requestId === editingReq.id).forEach(t => {
          updateTask(t.id, { assigneeId: managerId });
        });
      }
    }

    setIsModalOpen(false);
    refreshData();
  };

  // Task Handlers
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReq || !taskTitle.trim() || !taskDate) return;
    const dueTime = new Date(taskDate).getTime();

    if (editingTask) {
      updateTask(editingTask.id, {
        title: taskTitle.trim(),
        dueDate: dueTime,
      });
      setEditingTask(null);
    } else {
      addTask({
        requestId: editingReq.id,
        title: taskTitle.trim(),
        dueDate: dueTime,
        assigneeId: editingReq.managerId,
        isDone: false
      });
    }

    setTaskTitle('');
    setTaskDate('');
    refreshData();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    const d = new Date(task.dueDate);
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setTaskDate(formatted);
  };

  const handleCancelEditTask = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDate('');
  };

  const handleToggleTask = (task: Task) => {
    updateTask(task.id, { isDone: !task.isDone });
    refreshData();
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    if (statusFilter && req.status !== statusFilter) return false;
    if (managerFilter && req.managerId !== managerFilter) return false;
    
    if (periodFilter !== 'all') {
      const now = Date.now();
      let start = 0;
      if (periodFilter === 'today') start = startOfDay(now).getTime();
      if (periodFilter === 'week') start = startOfWeek(now, { weekStartsOn: 1 }).getTime();
      if (periodFilter === 'month') start = startOfMonth(now).getTime();
      if (req.createdAt < start) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const client = clients.find(c => c.id === req.clientId);
      const matchId = req.id.toLowerCase().includes(q);
      const matchClient = client ? client.name.toLowerCase().includes(q) || client.phone.includes(q) : false;
      const matchDesc = req.description ? req.description.toLowerCase().includes(q) : false;
      const matchBrand = req.brand ? req.brand.toLowerCase().includes(q) : false;
      return matchId || matchClient || matchDesc || matchBrand;
    }

    return true;
  });

  const getServiceName = (s: string) => {
    if (s === 'installation') return t('srvInstall');
    if (s === 'maintenance') return t('srvMaintain');
    if (s === 'repair') return t('srvRepair');
    return s;
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'new': return <span className="badge badge-new">{t('statusNew')}</span>;
      case 'in_progress': return <span className="badge badge-in-progress">{t('statusInProgress')}</span>;
      case 'done': return <span className="badge badge-done">{t('statusDone')}</span>;
      case 'cancelled': return <span className="badge badge-cancelled">{t('statusCancelled')}</span>;
      default: return null;
    }
  };

  const reqTasks = editingReq ? allTasks.filter(t => t.requestId === editingReq.id) : [];

  // Group requests for Kanban
  const kanbanColumns: { status: CRMRequest['status']; label: string; color: string; bg: string }[] = [
    { status: 'new', label: t('statusNew'), color: 'var(--color-primary)', bg: 'rgba(200, 132, 42, 0.08)' },
    { status: 'in_progress', label: t('statusInProgress'), color: 'var(--color-warning)', bg: 'rgba(212, 168, 67, 0.08)' },
    { status: 'done', label: t('statusDone'), color: 'var(--color-success)', bg: 'rgba(90, 158, 110, 0.08)' },
    { status: 'cancelled', label: t('statusCancelled'), color: 'var(--color-danger)', bg: 'rgba(192, 81, 74, 0.08)' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('requests')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {lang === 'ru' ? `Всего заявок: ${filteredRequests.length}` : `Jami arizalar: ${filteredRequests.length}`}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* View toggle */}
          <div className="view-toggle-wrap">
            <button
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('kanban')}
              title="Канбан-доска"
            >
              <LayoutGrid size={16} />
              <span className="hide-mobile">Канбан</span>
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('table')}
              title="Таблица"
            >
              <List size={16} />
              <span className="hide-mobile">Таблица</span>
            </button>
          </div>

          <button
            className="btn btn-outline"
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
            onClick={() => exportRequestsToCSV(filteredRequests, clients, users, 'zayavki')}
            title="Выгрузить данные в файл Excel (CSV)"
          >
            <Download size={15} />
            <span className="hide-mobile">{lang === 'ru' ? 'Экспорт в Excel' : 'Excelga eksport'}</span>
          </button>

          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            <span>{t('add')}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem' }}>
        <div style={{ flex: '1 1 220px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              style={{ paddingLeft: '2.5rem', width: '100%' }} 
              placeholder={lang === 'ru' ? 'Поиск по номеру, клиенту, бренду...' : 'Qidiruv...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">{t('status')} (Все)</option>
          <option value="new">{t('statusNew')}</option>
          <option value="in_progress">{t('statusInProgress')}</option>
          <option value="done">{t('statusDone')}</option>
          <option value="cancelled">{t('statusCancelled')}</option>
        </select>

        <select className="input-field" value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}>
          <option value="all">{t('allTime')}</option>
          <option value="today">{t('today')}</option>
          <option value="week">{t('thisWeek')}</option>
          <option value="month">{t('thisMonth')}</option>
        </select>

        {user?.role === 'boss' && (
          <select className="input-field" value={managerFilter} onChange={e => setManagerFilter(e.target.value)}>
            <option value="">{t('assignee')} (Все)</option>
            {users.filter(u => u.role === 'manager').map(u => (
              <option key={u.id} value={u.id}>{u.name || u.login}</option>
            ))}
          </select>
        )}
      </div>

      {/* ==================== KANBAN BOARD VIEW ==================== */}
      {viewMode === 'kanban' && (
        <div className="kanban-board">
          {kanbanColumns.map(col => {
            const colRequests = filteredRequests.filter(r => r.status === col.status);
            const colSum = colRequests.reduce((acc, r) => acc + (r.amount || 0), 0);

            return (
              <div key={col.status} className="kanban-column">
                <div className="kanban-column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="kanban-column-dot" style={{ background: col.color }} />
                    <span className="kanban-column-title">{col.label}</span>
                    <span className="kanban-column-count">{colRequests.length}</span>
                  </div>
                  <div className="kanban-column-sum">{colSum > 0 ? formatMoney(colSum) : ''}</div>
                </div>

                <div className="kanban-cards-list">
                  {colRequests.map(req => {
                    const client = clients.find(c => c.id === req.clientId);
                    const manager = users.find(u => u.id === req.managerId);
                    const reqTasksCount = allTasks.filter(t => t.requestId === req.id).length;

                    return (
                      <div key={req.id} className="kanban-card" onClick={() => handleOpenModal(req)}>
                        {/* Top row: ID + Service badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span className="kanban-req-id">{req.id}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {getServiceName(req.service)}
                          </span>
                        </div>

                        {/* Client info */}
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem', color: 'var(--text-heading)' }}>
                          {client?.name || 'Клиент'}
                        </div>
                        {client?.phone && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                            {client.phone}
                          </div>
                        )}

                        {/* AC Details Badges */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                          {req.brand && (
                            <span className="ac-spec-badge">
                              <Wind size={12} /> {req.brand} {req.btu ? req.btu.split(' ')[0] : ''}
                            </span>
                          )}
                          {req.objectType && (
                            <span className="ac-spec-badge">
                              📍 {req.objectType} {req.floor ? `(${req.floor}-эт)` : ''}
                            </span>
                          )}
                          {req.needLift && (
                            <span className="ac-spec-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }}>
                              🪜 Вышка
                            </span>
                          )}
                        </div>

                        {/* Amount & Assignee row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                          <div style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                            {req.amount > 0 ? formatMoney(req.amount) : 'Без цены'}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                            {manager?.name || manager?.login || ''}
                          </div>
                        </div>

                        {/* Quick action buttons row */}
                        <div className="kanban-quick-actions" onClick={e => e.stopPropagation()}>
                          {req.status === 'new' && (
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ width: '100%', justifyContent: 'center', fontSize: '0.76rem', padding: '0.3rem' }}
                              onClick={() => handleQuickStatusChange(req, 'in_progress')}
                            >
                              <span>В работу</span> <ArrowRight size={13} />
                            </button>
                          )}
                          {req.status === 'in_progress' && (
                            <div style={{ display: 'flex', gap: '0.4rem', width: '100%' }}>
                              <button
                                className="btn btn-sm btn-primary"
                                style={{ flex: 1, justifyContent: 'center', fontSize: '0.74rem', padding: '0.3rem', background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                                onClick={() => handleQuickStatusChange(req, 'done')}
                                title="Выполнено"
                              >
                                <Check size={13} /> Готово
                              </button>
                              <button
                                className="btn btn-sm btn-outline"
                                style={{ justifyContent: 'center', fontSize: '0.74rem', padding: '0.3rem 0.6rem', color: 'var(--color-danger)' }}
                                onClick={() => handleQuickStatusChange(req, 'cancelled')}
                                title="Отменить"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          )}
                          {(req.status === 'done' || req.status === 'cancelled') && (
                            <button
                              className="btn btn-sm btn-outline"
                              style={{ width: '100%', justifyContent: 'center', fontSize: '0.74rem', padding: '0.25rem' }}
                              onClick={() => handleQuickStatusChange(req, 'in_progress')}
                              title="Вернуть в работу"
                            >
                              <RotateCcw size={12} /> Вернуть в работу
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colRequests.length === 0 && (
                    <div className="kanban-empty-col">
                      Нет заявок
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== TABLE VIEW ==================== */}
      {viewMode === 'table' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('requestNumber')}</th>
                <th>{t('clients')}</th>
                <th>{t('service')}</th>
                <th>Кондиционер</th>
                <th>{t('amount')}</th>
                <th>{t('assignee')}</th>
                <th>{t('status')}</th>
                <th>{t('date')}</th>
                <th style={{ width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(req => {
                const c = clients.find(cl => cl.id === req.clientId);
                const m = users.find(u => u.id === req.managerId);
                return (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600 }}>{req.id}</td>
                    <td>{c?.name || '-'}</td>
                    <td>{getServiceName(req.service)}</td>
                    <td>
                      {req.brand ? (
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {req.brand} {req.btu ? `(${req.btu.split(' ')[0]})` : ''}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{req.amount > 0 ? formatMoney(req.amount) : '-'}</td>
                    <td>{m?.name || m?.login || '-'}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{format(req.createdAt, 'dd.MM.yyyy')}</td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleOpenModal(req)}>
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    {t('notFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingReq ? `${t('requests')} ${editingReq.id}` : t('add')}>
        {editingReq && (
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto' }}>
            <button 
              style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'info' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'info' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab('info')}
            >
              Инфо
            </button>
            <button 
              style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'tasks' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'tasks' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab('tasks')}
            >
              {t('tasks')} ({reqTasks.length})
            </button>
            <button 
              style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'history' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab('history')}
            >
              {t('history') || 'История'}
            </button>
          </div>
        )}

        {activeTab === 'info' && (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">{t('clients')} *</label>
              <select className="input-field" value={clientId} onChange={e => setClientId(e.target.value)} required>
                {clients.length === 0 && <option value="">---</option>}
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">{t('service')} *</label>
                <select className="input-field" value={service} onChange={e => setService(e.target.value as any)} required>
                  <option value="installation">{t('srvInstall')}</option>
                  <option value="maintenance">{t('srvMaintain')}</option>
                  <option value="repair">{t('srvRepair')}</option>
                </select>
              </div>

              {editingReq ? (
                <div className="input-group">
                  <label className="input-label">{t('status')} *</label>
                  <select className="input-field" value={status} onChange={e => setStatus(e.target.value as any)} required>
                    <option value="new">{t('statusNew')}</option>
                    <option value="in_progress">{t('statusInProgress')}</option>
                    <option value="done">{t('statusDone')}</option>
                    <option value="cancelled">{t('statusCancelled')}</option>
                  </select>
                </div>
              ) : (
                <div className="input-group">
                  <label className="input-label">{t('status')}</label>
                  <select className="input-field" value={status} onChange={e => setStatus(e.target.value as any)}>
                    <option value="new">{t('statusNew')}</option>
                    <option value="in_progress">{t('statusInProgress')}</option>
                  </select>
                </div>
              )}
            </div>

            {/* AC Equipment Specialization block */}
            <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Wind size={16} /> Параметры кондиционера и объекта
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="input-label">Марка / Бренд</label>
                  <select className="input-field" value={brand} onChange={e => setBrand(e.target.value)}>
                    {AC_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="input-label">Мощность (BTU)</label>
                  <select className="input-field" value={btu} onChange={e => setBtu(e.target.value)}>
                    {AC_BTU_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="input-label">Тип помещения</label>
                  <select className="input-field" value={objectType} onChange={e => setObjectType(e.target.value)}>
                    {OBJECT_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="input-label">Этаж блока</label>
                  <input className="input-field" value={floor} onChange={e => setFloor(e.target.value)} placeholder="Напр. 3" />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="liftCheck"
                  checked={needLift}
                  onChange={e => setNeedLift(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="liftCheck" style={{ fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  Требуется автовышка или услуги альпиниста
                </label>
              </div>
            </div>

            {status === 'cancelled' && (
              <div className="input-group">
                <label className="input-label">{t('cancelReason')} *</label>
                <input className="input-field" value={cancelReason} onChange={e => setCancelReason(e.target.value)} required />
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">{t('amount')} (сум)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="number" className="input-field" style={{ paddingLeft: '2.25rem', width: '100%' }} value={amount} onChange={e => setAmount(e.target.value)} min="0" />
                </div>
              </div>
              {user?.role === 'boss' && (
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">{t('assignee')}</label>
                  <select className="input-field" value={managerId} onChange={e => setManagerId(e.target.value)}>
                    {users.filter(u => u.role === 'manager').map(u => <option key={u.id} value={u.id}>{u.name || u.login}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">{t('description')}</label>
              <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Дополнительные примечания к заказу..." />
            </div>

            {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>
                {t('cancel')}
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                {t('save')}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'tasks' && editingReq && (
          <div>
            <form onSubmit={handleAddTask} style={{ marginBottom: '1.25rem' }}>
              {editingTask && (
                <div style={{
                  fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary)',
                  marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  ✏️ {t('edit') || 'Редактирование'}: <em>{editingTask.title}</em>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="input-field" style={{ flex: 1 }}
                  placeholder={t('title')}
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  required
                />
                <input
                  type="datetime-local" className="input-field"
                  value={taskDate}
                  onChange={e => setTaskDate(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary">
                  {editingTask ? <Edit2 size={16} /> : <Plus size={16} />}
                </button>
                {editingTask && (
                  <button type="button" className="btn btn-outline" onClick={handleCancelEditTask}
                    title={t('cancel')} style={{ padding: '0 0.75rem' }}
                  >×</button>
                )}
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
              {reqTasks.map(task => (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                  backgroundColor: task.isDone ? 'rgba(0,0,0,0.02)' : 'var(--bg-surface)',
                  gap: '0.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={task.isDone}
                      onChange={() => handleToggleTask(task)}
                      style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        textDecoration: task.isDone ? 'line-through' : 'none',
                        color: task.isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                        fontWeight: 500, fontSize: '0.9rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {format(task.dueDate, 'dd.MM.yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.25rem 0.5rem', flexShrink: 0 }}
                    onClick={() => handleEditTask(task)}
                    title={t('edit') || 'Редактировать'}
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              ))}
              {reqTasks.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                  {t('noTasks')}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && editingReq && (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(editingReq.history || []).map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', marginTop: '6px' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {format(h.date, 'dd.MM.yyyy HH:mm')}
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>{h.message}</div>
                  </div>
                </div>
              ))}
              {(!editingReq.history || editingReq.history.length === 0) && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                  {t('historyEmpty') || 'История пуста'}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
