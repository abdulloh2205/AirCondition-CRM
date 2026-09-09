import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getRequests, getTasks, getClients, getUsers, updateTask } from '../store';
import { CRMRequest, Task, Client, User } from '../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ru, uz } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, Phone, MapPin, Wind, User as UserIcon } from 'lucide-react';
import { formatMoney } from '../utils/formatters';

export const Calendar = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState<CRMRequest[]>([]);
  const [tasks, setAllTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedManager, setSelectedManager] = useState<string>('');

  const refreshData = () => {
    let reqs = getRequests();
    if (user?.role === 'manager') {
      reqs = reqs.filter(r => r.managerId === user.id);
    }
    setRequests(reqs);
    setClients(getClients());
    setUsers(getUsers());
    setAllTasks(getTasks());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('crm_store_updated', refreshData);
    return () => window.removeEventListener('crm_store_updated', refreshData);
  }, [user]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
  };

  // Filter items by manager if boss selected one
  const filteredRequests = requests.filter(r => !selectedManager || r.managerId === selectedManager);
  const filteredTasks = tasks.filter(t => !selectedManager || t.assigneeId === selectedManager);

  // Get items for a given day
  const getItemsForDay = (day: Date) => {
    const dayTasks = filteredTasks.filter(t => isSameDay(new Date(t.dueDate), day));
    const dayRequests = filteredRequests.filter(r => isSameDay(new Date(r.createdAt), day));
    return { dayTasks, dayRequests };
  };

  const selectedDayItems = getItemsForDay(selectedDay);

  const weekDayNames = lang === 'ru' 
    ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    : ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];

  const getServiceBadge = (srv: string) => {
    if (srv === 'installation') return <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>Монтаж</span>;
    if (srv === 'maintenance') return <span className="badge" style={{ background: 'rgba(212, 168, 67, 0.15)', color: 'var(--color-warning)' }}>ТО / Чистка</span>;
    return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-danger)' }}>Ремонт</span>;
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {lang === 'ru' ? 'График выездов и монтажей' : 'Chiqishlar va o\'rnatishlar taqvimi'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {lang === 'ru' ? 'Календарный план работ по кондиционерам и задачам мастеров' : 'Konditsionerlar bo\'yicha ishlar rejasi'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {user?.role === 'boss' && (
            <select
              className="input-field"
              style={{ width: 'auto' }}
              value={selectedManager}
              onChange={e => setSelectedManager(e.target.value)}
            >
              <option value="">Все сотрудники</option>
              {users.filter(u => u.role === 'manager').map(u => (
                <option key={u.id} value={u.id}>{u.name || u.login}</option>
              ))}
            </select>
          )}

          <button className="btn btn-outline" onClick={goToToday}>
            {lang === 'ru' ? 'Сегодня' : 'Bugun'}
          </button>
          
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className="btn btn-outline btn-icon" onClick={prevMonth} title="Предыдущий месяц">
              <ChevronLeft size={18} />
            </button>
            <button className="btn btn-outline btn-icon" onClick={nextMonth} title="Следующий месяц">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Month Label */}
      <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary)', textTransform: 'capitalize' }}>
        {format(currentDate, 'LLLL yyyy', { locale: lang === 'ru' ? ru : uz })}
      </div>

      {/* Main Layout: Calendar Grid + Selected Day Details */}
      <div className="calendar-page-layout">
        {/* Calendar Grid */}
        <div className="card calendar-grid-card">
          <div className="calendar-grid-header">
            {weekDayNames.map((name, i) => (
              <div key={i} className="calendar-header-day">
                {name}
              </div>
            ))}
          </div>

          <div className="calendar-grid-cells">
            {calendarDays.map((day, idx) => {
              const { dayTasks, dayRequests } = getItemsForDay(day);
              const totalItems = dayTasks.length + dayRequests.length;
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isSelected = isSameDay(day, selectedDay);
              const isTodayDay = isToday(day);

              return (
                <div
                  key={idx}
                  className={`calendar-cell ${!isCurrentMonth ? 'calendar-cell-other-month' : ''} ${isSelected ? 'calendar-cell-selected' : ''} ${isTodayDay ? 'calendar-cell-today' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="calendar-cell-top">
                    <span className={`calendar-day-number ${isTodayDay ? 'calendar-today-badge' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {totalItems > 0 && (
                      <span className="calendar-items-count">
                        {totalItems}
                      </span>
                    )}
                  </div>

                  <div className="calendar-cell-events">
                    {dayRequests.slice(0, 2).map(r => (
                      <div key={r.id} className="calendar-event-pill req-pill" title={`${r.id}: ${r.service}`}>
                        ❄️ {r.brand || r.id}
                      </div>
                    ))}
                    {dayTasks.slice(0, 2).map(t => (
                      <div key={t.id} className={`calendar-event-pill task-pill ${t.isDone ? 'task-done' : ''}`} title={t.title}>
                        ✓ {t.title}
                      </div>
                    ))}
                    {totalItems > 4 && (
                      <div className="calendar-event-more">+{totalItems - 4} ещё</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Sidebar Panel */}
        <div className="card calendar-day-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <CalendarIcon size={20} color="var(--color-primary)" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-heading)' }}>
                {format(selectedDay, 'd MMMM, eeee', { locale: lang === 'ru' ? ru : uz })}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {selectedDayItems.dayRequests.length} заявок, {selectedDayItems.dayTasks.length} задач
              </div>
            </div>
          </div>

          {/* Requests on this day */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              ❄️ Заявки на этот день ({selectedDayItems.dayRequests.length})
            </div>

            {selectedDayItems.dayRequests.map(req => {
              const client = clients.find(c => c.id === req.clientId);
              const manager = users.find(u => u.id === req.managerId);

              return (
                <div key={req.id} className="calendar-detail-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.88rem' }}>{req.id}</span>
                    {getServiceBadge(req.service)}
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                    {client?.name || 'Клиент'}
                  </div>

                  {client?.phone && (
                    <a href={`tel:${client.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '0.3rem' }}>
                      <Phone size={13} /> {client.phone}
                    </a>
                  )}

                  {client?.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      <MapPin size={13} /> {client.address}
                    </div>
                  )}

                  {req.brand && (
                    <div style={{ fontSize: '0.78rem', background: 'var(--bg-base)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', display: 'inline-block', marginBottom: '0.4rem' }}>
                      {req.brand} {req.btu} • {req.objectType} {req.floor ? `(${req.floor}-эт)` : ''}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 800 }}>{req.amount > 0 ? formatMoney(req.amount) : 'Без цены'}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{manager?.name || manager?.login}</span>
                  </div>
                </div>
              );
            })}

            {selectedDayItems.dayRequests.length === 0 && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                Нет запланированных заявок
              </div>
            )}
          </div>

          {/* Tasks on this day */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              ✓ Задачи мастеров ({selectedDayItems.dayTasks.length})
            </div>

            {selectedDayItems.dayTasks.map(task => {
              const assignee = users.find(u => u.id === task.assigneeId);

              return (
                <div key={task.id} className="calendar-detail-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={task.isDone}
                    onChange={() => {
                      updateTask(task.id, { isDone: !task.isDone });
                      refreshData();
                    }}
                    style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', textDecoration: task.isDone ? 'line-through' : 'none', color: task.isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span><Clock size={11} style={{ verticalAlign: 'middle' }} /> {format(task.dueDate, 'HH:mm')}</span>
                      <span>• {assignee?.name || assignee?.login}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {selectedDayItems.dayTasks.length === 0 && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                Нет задач на этот день
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
