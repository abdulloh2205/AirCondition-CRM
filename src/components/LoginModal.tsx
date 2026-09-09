import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const ROLES = [
  { id: 'boss', login: 'boss', password: '123', emoji: '👔', label: 'Руководитель', labelUz: 'Rahbar' },
  { id: 'manager', login: 'manager1', password: '123', emoji: '👷', label: 'Менеджер', labelUz: 'Menejer' },
];

interface Props {
  onClose: () => void;
}

export const LoginModal: React.FC<Props> = ({ onClose }) => {
  const { login } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<'boss' | 'manager' | null>(null);
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'Enter') handleLogin();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [loginVal, password, selectedRole]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const handleRoleSelect = (role: 'boss' | 'manager') => {
    setSelectedRole(role);
    const r = ROLES.find(r => r.id === role)!;
    setLoginVal(r.login);
    setError('');
  };

  const handleLogin = () => {
    if (!selectedRole) {
      setError(lang === 'ru' ? 'Выберите роль' : 'Rolni tanlang');
      return;
    }
    if (!loginVal.trim()) {
      setError(lang === 'ru' ? 'Введите логин' : 'Login kiriting');
      return;
    }
    if (!password) {
      setError(lang === 'ru' ? 'Введите пароль' : 'Parol kiriting');
      return;
    }
    setLoading(true);
    const ok = login(loginVal.trim(), password);
    if (ok) {
      navigate('/crm/clients', { replace: true });
    } else {
      setError(lang === 'ru' ? 'Неверный логин или пароль' : "Noto'g'ri login yoki parol");
      setLoading(false);
    }
  };

  const t = (ru: string, uz: string) => lang === 'ru' ? ru : uz;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: visible ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(8px)' : 'blur(0px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        transition: 'background 280ms ease, backdrop-filter 280ms ease',
      }}
    >
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
        overflow: 'hidden',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.96)',
        opacity: visible ? 1 : 0,
        transition: 'transform 280ms cubic-bezier(0.34,1.56,0.64,1), opacity 280ms ease',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '1.5rem 1.5rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>❄️</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              {t('Вход в систему', 'Tizimga kirish')}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>
              {t('AirCondition CRM', 'AirCondition CRM')}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'var(--bg-hover)', border: 'none', cursor: 'pointer',
              width: 34, height: 34, borderRadius: '50%', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', flexShrink: 0,
            }}
          >✕</button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── Role selection ── */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('Кто вы?', 'Siz kimsiz?')}
            </label>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleRoleSelect(r.id as 'boss' | 'manager')}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '0.35rem', padding: '0.875rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${selectedRole === r.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    background: selectedRole === r.id ? 'var(--color-primary-light)' : 'var(--bg-base)',
                    cursor: 'pointer', transition: 'all 0.18s ease',
                  }}
                >
                  <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{r.emoji}</span>
                  <span style={{
                    fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.2,
                    color: selectedRole === r.id ? 'var(--color-primary)' : 'var(--text-body)',
                  }}>
                    {lang === 'ru' ? r.label : r.labelUz}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Login field ── */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('Логин', 'Login')}
            </label>
            <input
              type="text"
              value={loginVal}
              onChange={e => { setLoginVal(e.target.value); setError(''); }}
              placeholder={t('Введите логин', 'Login kiriting')}
              autoComplete="username"
              style={{
                width: '100%', padding: '0.75rem 1rem',
                border: `1.5px solid ${error && !loginVal ? 'var(--color-danger)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-base)',
                color: 'var(--text-body)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.18s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onBlur={e => (e.currentTarget.style.borderColor = error && !loginVal ? 'var(--color-danger)' : 'var(--border-color)')}
            />
          </div>

          {/* ── Password field ── */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('Пароль', 'Parol')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder={t('Введите пароль', 'Parol kiriting')}
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '0.75rem 2.75rem 0.75rem 1rem',
                  border: `1.5px solid ${error && !password ? 'var(--color-danger)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-base)',
                  color: 'var(--text-body)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.18s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                onBlur={e => (e.currentTarget.style.borderColor = error && !password ? 'var(--color-danger)' : 'var(--border-color)')}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '1rem', color: 'var(--text-muted)', padding: 0,
                }}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              background: 'rgba(220,50,50,0.08)',
              border: '1px solid rgba(220,50,50,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.875rem',
              fontSize: '0.82rem', color: '#c0392b',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              animation: 'slideUp 180ms ease',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Buttons ── */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <button
              onClick={handleClose}
              style={{
                flex: 1, padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-body)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
              }}
            >
              {t('Отмена', 'Bekor qilish')}
            </button>
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                flex: 2, padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-primary)',
                color: 'white', fontWeight: 700, fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.18s',
              }}
            >
              {loading ? '...' : t('Войти', 'Kirish')}
            </button>
          </div>

          {/* ── Hint ── */}
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            {t('Демо: логин boss / manager1, пароль 123', "Demo: login boss / manager1, parol 123")}
          </p>

        </div>
      </div>
    </div>
  );
};
