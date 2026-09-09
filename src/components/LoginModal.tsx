import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const LoginModal: React.FC<Props> = ({ onClose }) => {
  const { login } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

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
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginVal.trim()) {
      setError(lang === 'ru' ? 'Введите логин' : 'Login kiriting');
      return;
    }
    if (!password) {
      setError(lang === 'ru' ? 'Введите пароль' : 'Parol kiriting');
      return;
    }
    setLoading(true);
    setError('');

    const res = await login(loginVal.trim(), password);
    if (res.success) {
      navigate('/crm/clients', { replace: true });
    } else {
      setError(res.error || (lang === 'ru' ? 'Неверный логин или пароль' : "Noto'g'ri login yoki parol"));
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

        <form onSubmit={handleLogin} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* ── Login field ── */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>
              {t('Логин', 'Login')}
            </label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={loginVal}
                onChange={e => { setLoginVal(e.target.value); setError(''); }}
                placeholder={t('Введите логин', 'Login kiriting')}
                autoComplete="username"
                autoFocus
                className="input-field"
                style={{ width: '100%', paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {/* ── Password field ── */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>
              {t('Пароль', 'Parol')}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder={t('Введите пароль', 'Parol kiriting')}
                autoComplete="current-password"
                className="input-field"
                style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0,
                }}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
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
              fontSize: '0.82rem', color: 'var(--color-danger)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Buttons ── */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-outline"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {t('Отмена', 'Bekor qilish')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 2, justifyContent: 'center' }}
            >
              {loading ? '...' : t('Войти', 'Kirish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
