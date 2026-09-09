import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getRequests, getClients, getUsers } from '../store';
import { CRMRequest, Client, User } from '../types';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  Award,
  MapPin,
  Sparkles,
  Phone,
  Plus,
  ArrowUpRight,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  PieChart,
  DollarSign,
  Download
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { formatMoney } from '../utils/formatters';
import { exportRequestsToCSV } from '../utils/exportToExcel';

export const Dashboard = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [period, setPeriod] = useState<'all'|'today'|'week'|'month'>('all');
  const [requests, setRequests] = useState<CRMRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const refreshData = () => {
    setRequests(getRequests());
    setClients(getClients());
    setUsers(getUsers());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('crm_store_updated', refreshData);
    return () => window.removeEventListener('crm_store_updated', refreshData);
  }, []);

  if (user?.role !== 'boss') {
    return <Navigate to="/crm/requests" replace />;
  }

  const getFilteredRequests = () => {
    const now = Date.now();
    let startDate = 0;
    
    if (period === 'today') {
      startDate = startOfDay(now).getTime();
    } else if (period === 'week') {
      startDate = startOfWeek(now, { weekStartsOn: 1 }).getTime();
    } else if (period === 'month') {
      startDate = startOfMonth(now).getTime();
    }
    
    return requests.filter(r => r.createdAt >= startDate);
  };

  const filtered = getFilteredRequests();
  
  // Core Business Metrics
  const totalCount = filtered.length;
  const doneRequests = filtered.filter(r => r.status === 'done');
  const inProgressRequests = filtered.filter(r => r.status === 'in_progress');
  const newRequests = filtered.filter(r => r.status === 'new');
  const cancelledRequests = filtered.filter(r => r.status === 'cancelled');

  const totalRevenue = doneRequests.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const lostRevenue = cancelledRequests.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const conversionRate = totalCount > 0 ? Math.round((doneRequests.length / totalCount) * 100) : 0;
  const averageCheck = doneRequests.length > 0 ? Math.round(totalRevenue / doneRequests.length) : 0;

  // 1. Repeat Sales Generator (Customers needing seasonal Maintenance)
  // Find clients whose last installation or maintenance was >= 10 days ago (or simulate 6 months for realistic demo)
  const repeatSalesClients = clients.map(client => {
    const clientReqs = requests.filter(r => r.clientId === client.id && r.status === 'done');
    if (clientReqs.length === 0) return null;

    const latestDone = clientReqs.sort((a, b) => b.createdAt - a.createdAt)[0];
    const daysSince = Math.floor((Date.now() - latestDone.createdAt) / 86400000);

    // Eligible if service was >= 7 days ago (in demo data, corresponds to 10-40 days ago)
    if (daysSince >= 7) {
      return {
        client,
        latestDone,
        daysSince,
        potentialAmount: 250000, // Standard cleaning & freon recharge fee
      };
    }
    return null;
  }).filter(Boolean) as { client: Client; latestDone: CRMRequest; daysSince: number; potentialAmount: number }[];

  const totalRepeatPotential = repeatSalesClients.reduce((acc, c) => acc + c.potentialAmount, 0);

  // 2. Lost Revenue Analysis (Why do clients cancel?)
  const cancellationReasonsMap: Record<string, { count: number; sum: number }> = {};
  cancelledRequests.forEach(r => {
    const reason = r.cancelReason?.trim() || 'Причина не указана';
    if (!cancellationReasonsMap[reason]) {
      cancellationReasonsMap[reason] = { count: 0, sum: 0 };
    }
    cancellationReasonsMap[reason].count += 1;
    cancellationReasonsMap[reason].sum += (r.amount || 0);
  });

  const cancellationReasonsList = Object.entries(cancellationReasonsMap).map(([reason, data]) => ({
    reason,
    ...data,
  })).sort((a, b) => b.sum - a.sum);

  // 3. Geographic Analytics (Districts of Tashkent & Regions)
  const districtsMap: Record<string, { count: number; revenue: number }> = {};
  const KNOWN_LOCATIONS = [
    'Юнусобод', 'Чиланзар', 'Мирзо-Улугбек', 'Яшнабад', 'Сергели',
    'Учтепа', 'Яккасарай', 'Шайхонтохур', 'Олмазор', 'Самарканд',
    'Фергана', 'Наманган', 'Андижан', 'Бухара'
  ];

  filtered.forEach(r => {
    const client = clients.find(c => c.id === r.clientId);
    const addr = client?.address || '';
    
    let matchedDistrict = 'Другие районы';
    for (const loc of KNOWN_LOCATIONS) {
      if (addr.toLowerCase().includes(loc.toLowerCase())) {
        matchedDistrict = loc;
        break;
      }
    }

    if (!districtsMap[matchedDistrict]) {
      districtsMap[matchedDistrict] = { count: 0, revenue: 0 };
    }
    districtsMap[matchedDistrict].count += 1;
    if (r.status === 'done') {
      districtsMap[matchedDistrict].revenue += (r.amount || 0);
    }
  });

  const districtsList = Object.entries(districtsMap).map(([name, data]) => ({
    name,
    ...data,
  })).sort((a, b) => b.revenue - a.revenue || b.count - a.count);

  // 4. Employee KPI & Performance Ranking
  const managersList = users.filter(u => u.role === 'manager').map(m => {
    const managerReqs = filtered.filter(r => r.managerId === m.id);
    const done = managerReqs.filter(r => r.status === 'done');
    const inProgress = managerReqs.filter(r => r.status === 'in_progress');
    const revenue = done.reduce((acc, r) => acc + (r.amount || 0), 0);
    const conv = managerReqs.length > 0 ? Math.round((done.length / managerReqs.length) * 100) : 0;
    const avg = done.length > 0 ? Math.round(revenue / done.length) : 0;

    return {
      manager: m,
      totalAssigned: managerReqs.length,
      doneCount: done.length,
      inProgressCount: inProgress.length,
      revenue,
      conversion: conv,
      averageCheck: avg,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const handleCreateMaintenance = (clientId: string) => {
    navigate('/crm/requests', { state: { createForClient: clientId } });
  };

  return (
    <div>
      {/* Header & Period Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {lang === 'ru' ? 'Сводка руководителя' : 'Boshqaruv xulosasi'}
            </h1>
            <span className="badge" style={{ background: 'rgba(200, 132, 42, 0.15)', color: 'var(--color-primary)', fontWeight: 800 }}>
              BOSS ONLY
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {lang === 'ru' ? 'Ключевые бизнес-показатели, допродажи и аналитика прибыли' : 'Asosiy biznes ko\'rsatkichlari va daromad tahlili'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {(['all', 'today', 'week', 'month'] as const).map(p => {
            const labels: Record<string, string> = { all: t('allTime'), today: t('today'), week: t('thisWeek'), month: t('thisMonth') };
            return (
              <button
                key={p}
                className={period === p ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.82rem' }}
                onClick={() => setPeriod(p)}
              >
                {labels[p]}
              </button>
            );
          })}

          <button
            className="btn btn-outline"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem', marginLeft: '0.5rem' }}
            onClick={() => exportRequestsToCSV(filtered, clients, users, `svodka_${period}`)}
            title="Выгрузить данные в файл Excel (CSV)"
          >
            <Download size={15} />
            <span>{lang === 'ru' ? 'Отчет в Excel' : 'Excel hisobot'}</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Total Revenue */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Выручка (Оплачено)</span>
            <div style={{ background: 'rgba(90, 158, 110, 0.15)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {formatMoney(totalRevenue)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Выполнено заказов: <strong>{doneRequests.length}</strong>
          </div>
        </div>

        {/* Lost Revenue */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 700 }}>Упущенная выгода</span>
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)' }}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-danger)' }}>
            {formatMoney(lostRevenue)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Потеряно на <strong>{cancelledRequests.length}</strong> отменах
          </div>
        </div>

        {/* Average Check */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Средний чек</span>
            <div style={{ background: 'rgba(200, 132, 42, 0.15)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>
            {formatMoney(averageCheck)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            На 1 успешный выезд
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Конверсия воронки</span>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: '#2563eb' }}>
              <Activity size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: conversionRate >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {conversionRate}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {doneRequests.length} из {totalCount} заявок закрыто
          </div>
        </div>
      </div>

      {/* FEATURE 1: REPEAT SALES RADAR (КОМУ ПОРА НА ТО) */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.5rem', border: '1.5px solid var(--color-primary)', background: 'linear-gradient(180deg, var(--bg-surface) 0%, rgba(200, 132, 42, 0.03) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>💰</span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                {lang === 'ru' ? 'Генератор повторных продаж (Кому пора на сезонное ТО)' : 'Qayta sotuvlar generatori (Mavsumiy texnik xizmat)'}
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {lang === 'ru'
                ? 'Клиенты, которым ставили или чистили кондиционер в прошлый сезон. Готовая выручка по звонку!'
                : 'O\'tgan mavsumda xizmat ko\'rsatilgan mijozlar bazasi.'}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Потенциальная выручка базы:</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              +{formatMoney(totalRepeatPotential)}
            </div>
          </div>
        </div>

        {repeatSalesClients.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Телефон</th>
                  <th>Оборудование</th>
                  <th>Последняя работа</th>
                  <th>Срок</th>
                  <th>Ожидаемый чек</th>
                  <th style={{ textAlign: 'right' }}>Действие</th>
                </tr>
              </thead>
              <tbody>
                {repeatSalesClients.slice(0, 6).map(({ client, latestDone, daysSince, potentialAmount }) => (
                  <tr key={client.id}>
                    <td style={{ fontWeight: 700 }}>{client.name}</td>
                    <td>
                      <a href={`tel:${client.phone}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                        {client.phone}
                      </a>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                        ❄️ {latestDone.brand || 'Кондиционер'} {latestDone.btu ? latestDone.btu.split(' ')[0] : ''}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{latestDone.description || 'Монтаж'}</td>
                    <td>
                      <span style={{ color: daysSince > 20 ? 'var(--color-warning)' : 'var(--text-secondary)', fontWeight: 700 }}>
                        {daysSince} дней назад
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                      {formatMoney(potentialAmount)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                        onClick={() => handleCreateMaintenance(client.id)}
                      >
                        <Plus size={13} /> Назначить ТО
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Все клиенты обслужены недавно
          </div>
        )}
      </div>

      {/* 2-COLUMN SECTION: LOST REVENUE & GEOGRAPHY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        
        {/* FEATURE 2: LOST REVENUE ANALYSIS */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.2rem' }}>📉</span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)' }}>
              {lang === 'ru' ? 'Анализ упущенной выгоды (Причины отмен)' : 'Bekor qilingan arizalar tahlili'}
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Где компания теряет деньги и почему клиенты отказываются
          </p>

          {cancellationReasonsList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {cancellationReasonsList.map((item, idx) => {
                const percentOfLoss = lostRevenue > 0 ? Math.round((item.sum / lostRevenue) * 100) : 0;
                return (
                  <div key={idx} style={{ background: 'var(--bg-base)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-heading)' }}>
                        {item.reason}
                      </span>
                      <span style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '0.9rem' }}>
                        -{formatMoney(item.sum)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      <span>{item.count} заявок</span>
                      <span>{percentOfLoss}% от всех потерь</span>
                    </div>

                    <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentOfLoss}%`, height: '100%', background: 'var(--color-danger)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              В выбранном периоде нет отмененных заявок
            </div>
          )}
        </div>

        {/* FEATURE 3: GEOGRAPHIC REVENUE BY DISTRICT */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.2rem' }}>📍</span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)' }}>
              {lang === 'ru' ? 'География заказов (Районы Ташкента)' : 'Hududlar bo\'yicha tahlil'}
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Какие районы приносят наибольшую выручку для логистики бригад
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
            {districtsList.map((d, idx) => {
              const percentOfTotal = totalRevenue > 0 ? Math.round((d.revenue / totalRevenue) * 100) : 0;

              return (
                <div key={idx} style={{ background: 'var(--bg-base)', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={14} color="var(--color-primary)" />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                      {d.revenue > 0 ? formatMoney(d.revenue) : '0 сум'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    <span>{d.count} заказов</span>
                    <span>{percentOfTotal}% от выручки</span>
                  </div>

                  <div style={{ width: '100%', height: '5px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentOfTotal}%`, height: '100%', background: 'var(--color-primary)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FEATURE 4: EMPLOYEE KPI & PERFORMANCE RANKING */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🥇</span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                {lang === 'ru' ? 'Рейтинг и KPI сотрудников (Кто приносит кассу)' : 'Xodimlar reytingi va KPI'}
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Прозрачный вклад каждого менеджера и мастера в прибыль компании
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Место</th>
                <th>Сотрудник</th>
                <th>В кассу компании</th>
                <th>Закрыто заказов</th>
                <th>В работе</th>
                <th>Конверсия</th>
                <th>Средний чек</th>
              </tr>
            </thead>
            <tbody>
              {managersList.map((item, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

                return (
                  <tr key={item.manager.id}>
                    <td style={{ fontSize: '1.2rem', textAlign: 'center' }}>{medal}</td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                        {item.manager.name || item.manager.login}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Логин: {item.manager.login}
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-success)' }}>
                      {formatMoney(item.revenue)}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <span className="badge badge-done">{item.doneCount} выполнено</span>
                    </td>
                    <td>
                      <span className="badge badge-in-progress">{item.inProgressCount} в работе</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: item.conversion >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {item.conversion}%
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {formatMoney(item.averageCheck)}
                    </td>
                  </tr>
                );
              })}
              {managersList.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Нет данных по менеджерам
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SERVICE TYPES BREAKDOWN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem', gap: '0.4rem', backgroundColor: 'var(--bg-input)' }}>
          <PieChart size={24} style={{ color: 'var(--color-primary)' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Монтаж и установка</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{filtered.filter(r => r.service === 'installation').length}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem', gap: '0.4rem', backgroundColor: 'var(--bg-input)' }}>
          <PieChart size={24} style={{ color: 'var(--color-warning)' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ТО и чистка</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{filtered.filter(r => r.service === 'maintenance').length}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem', gap: '0.4rem', backgroundColor: 'var(--bg-input)' }}>
          <PieChart size={24} style={{ color: 'var(--color-danger)' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Срочный ремонт</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{filtered.filter(r => r.service === 'repair').length}</div>
        </div>
      </div>
    </div>
  );
};
