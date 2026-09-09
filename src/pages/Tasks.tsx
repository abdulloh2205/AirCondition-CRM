import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getTasks, updateTask, getRequests, getClients, getUsers } from '../store';
import { Task, CRMRequest, Client, User } from '../types';
import { CheckCircle2, Calendar, FileText, User as UserIcon } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';

export const Tasks = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [requests, setRequests] = useState<CRMRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    refreshData();
    window.addEventListener('crm_store_updated', refreshData);
    return () => window.removeEventListener('crm_store_updated', refreshData);
  }, [user]);

  const refreshData = () => {
    if (!user) return;

    const allRequests = getRequests();
    const allTasks = getTasks();

    let visibleTasks: typeof allTasks;

    if (user.role === 'boss') {
      // Boss sees all pending tasks
      visibleTasks = allTasks.filter(t => !t.isDone);
    } else {
      // Manager: only tasks assigned to them AND belonging to their own requests
      const myRequestIds = new Set(
        allRequests.filter(r => r.managerId === user.id).map(r => r.id)
      );
      visibleTasks = allTasks.filter(
        t => !t.isDone && t.assigneeId === user.id && myRequestIds.has(t.requestId)
      );
    }

    visibleTasks.sort((a, b) => a.dueDate - b.dueDate);
    setTasks(visibleTasks);
    setRequests(allRequests);
    setClients(getClients());
    setUsers(getUsers());
  };

  const markDone = (taskId: string) => {
    updateTask(taskId, { isDone: true });
    refreshData();
  };

  const renderTaskCard = (task: Task) => {
    const isOverdue = task.dueDate < Date.now();
    const req = requests.find(r => r.id === task.requestId);
    const client = req ? clients.find(c => c.id === req.clientId) : null;

    return (
      <div key={task.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: isOverdue ? '4px solid var(--color-danger)' : '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{task.title}</h3>
          <button 
            className="btn btn-outline"
            style={{ padding: '0.25rem 0.5rem', color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
            onClick={() => markDone(task.id)}
            title={t('done')}
          >
            <CheckCircle2 size={16} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isOverdue ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
            <Calendar size={14} /> 
            <span style={{ fontWeight: isOverdue ? 'bold' : 'normal' }}>
              {format(task.dueDate, 'dd.MM.yyyy HH:mm')}
              {isOverdue && ` (${t('overdue')})`}
            </span>
          </div>
          {req && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <FileText size={14} />
              <Link to="/crm/requests" style={{ color: 'var(--color-primary)' }}>
                {req.id} {client ? `- ${client.name}` : ''}
              </Link>
            </div>
          )}
          {user?.role === 'boss' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <UserIcon size={14} />
              <span>{users.find(u => u.id === task.assigneeId)?.login ?? '—'}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const now = Date.now();
  const todayEnd = startOfDay(now).getTime() + 86400000;

  const overdueTasks = tasks.filter(t => t.dueDate < now);
  const todayTasks = tasks.filter(t => t.dueDate >= now && t.dueDate < todayEnd);
  const upcomingTasks = tasks.filter(t => t.dueDate >= todayEnd);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        {user?.role === 'boss' ? t('tasks') : t('myTasks')}
      </h1>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <p>{t('notFound')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {overdueTasks.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-danger)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                🔴 {t('overdue')} ({overdueTasks.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {overdueTasks.map(renderTaskCard)}
              </div>
            </div>
          )}

          {todayTasks.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                🟡 {t('taskToday')} ({todayTasks.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {todayTasks.map(renderTaskCard)}
              </div>
            </div>
          )}

          {upcomingTasks.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-success)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                🟢 {t('taskUpcoming')} ({upcomingTasks.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {upcomingTasks.map(renderTaskCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
