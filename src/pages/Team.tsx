import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getUsers, addUser, updateUser, deleteUser, getRequests, getTasks } from '../store';
import { User, Role } from '../types';
import { Modal } from '../components/Modal';
import { Plus, Edit2, Trash2, UserCheck, Shield, Key, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export const Team = () => {
  const { t, lang } = useLanguage();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('123');
  const [role, setRole] = useState<Role>('manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Boss guard
  if (currentUser?.role !== 'boss') {
    return <Navigate to="/crm/requests" replace />;
  }

  const refreshData = () => {
    setUsers(getUsers());
    setRequests(getRequests());
    setTasks(getTasks());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('crm_store_updated', refreshData);
    return () => window.removeEventListener('crm_store_updated', refreshData);
  }, []);

  const handleOpenModal = (u?: User) => {
    setError('');
    if (u) {
      setEditingUser(u);
      setName(u.name || '');
      setLogin(u.login);
      setPassword('');
      setRole(u.role);
    } else {
      setEditingUser(null);
      setName('');
      setLogin('');
      setPassword('123');
      setRole('manager');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim()) {
      setError(lang === 'ru' ? 'Логин обязателен' : 'Login kiritilishi shart');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: name.trim() || login.trim(),
          role,
          ...(password ? { password } : {}),
        });
      } else {
        await addUser({
          login: login.trim().toLowerCase(),
          password: password || '123',
          role,
          name: name.trim() || login.trim(),
        });
      }
      setIsModalOpen(false);
      refreshData();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (u.id === 'u1') {
      alert(lang === 'ru' ? 'Главного администратора нельзя удалить' : 'Bosh adminni o\'chirib bo\'lmaydi');
      return;
    }

    const confirmMsg = lang === 'ru'
      ? `Вы действительно хотите удалить сотрудника ${u.name || u.login}?`
      : `Haqiqatan ham ${u.name || u.login} xodimini o'chirmoqchimisiz?`;

    if (window.confirm(confirmMsg)) {
      try {
        await deleteUser(u.id);
        refreshData();
      } catch (err: any) {
        alert(err.message || 'Ошибка при удалении');
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {lang === 'ru' ? 'Команда и сотрудники' : 'Jamoa va xodimlar'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {lang === 'ru' ? 'Управление доступом, добавление менеджеров и мастеров' : 'Xodimlarni boshqarish va kirish huquqlari'}
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          <span>{lang === 'ru' ? '+ Добавить сотрудника' : '+ Xodim qo\'shish'}</span>
        </button>
      </div>

      {/* Grid of employees */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {users.map(u => {
          const userRequests = requests.filter(r => r.managerId === u.id);
          const inProgressCount = userRequests.filter(r => r.status === 'in_progress' || r.status === 'new').length;
          const doneCount = userRequests.filter(r => r.status === 'done').length;
          const userTasks = tasks.filter(t => t.assigneeId === u.id && !t.isDone).length;
          const isCurrent = currentUser?.id === u.id;

          return (
            <div key={u.id} className="card employee-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Top: Avatar + Role badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="employee-avatar">
                      {u.role === 'boss' ? '👔' : '🧑‍🔧'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-heading)' }}>
                        {u.name || u.login}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Логин: <strong style={{ color: 'var(--color-primary)' }}>{u.login}</strong>
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${u.role === 'boss' ? 'badge-in-progress' : 'badge-new'}`}>
                    {u.role === 'boss' ? 'Руководитель' : 'Менеджер / Мастер'}
                  </span>
                </div>

                {/* Stats */}
                <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', padding: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-warning)' }}>{inProgressCount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>В работе</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-success)' }}>{doneCount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Завершено</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{userTasks}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Задач</div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem' }}
                  onClick={() => handleOpenModal(u)}
                >
                  <Edit2 size={14} /> Редактировать
                </button>
                {u.id !== 'u1' && (
                  <button
                    className="btn btn-outline"
                    style={{ color: 'var(--color-danger)', borderColor: 'var(--border-color)', padding: '0.4rem 0.6rem' }}
                    onClick={() => handleDelete(u)}
                    title="Удалить сотрудника"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Employee */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? (lang === 'ru' ? 'Редактировать сотрудника' : 'Xodimni tahrirlash') : (lang === 'ru' ? 'Новый сотрудник' : 'Yangi xodim')}
      >
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">ФИО / Отображаемое имя *</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Напр. Алишер Каримов (Монтажник)"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Логин для входа *</label>
            <input
              type="text"
              className="input-field"
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Напр. manager3"
              disabled={Boolean(editingUser && editingUser.id === 'u1')}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              {editingUser ? 'Новый пароль (оставьте пустым, если не меняется)' : 'Пароль *'}
            </label>
            <input
              type="text"
              className="input-field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Пароль"
              required={!editingUser}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Роль в системе *</label>
            <select
              className="input-field"
              value={role}
              onChange={e => setRole(e.target.value as Role)}
              disabled={Boolean(editingUser && editingUser.id === 'u1')}
            >
              <option value="manager">Менеджер / Монтажник (доступ только к своим заявкам)</option>
              <option value="boss">Руководитель (полный доступ ко всей компании)</option>
            </select>
          </div>

          {error && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить сотрудника'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
