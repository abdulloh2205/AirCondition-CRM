import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const ROLES = [
  { login: 'boss', password: '123', emoji: '👔', label: 'Boss', labelUz: 'Boss', desc: 'Полный доступ', descUz: 'To\'liq kirish' },
  { login: 'manager1', password: '123', emoji: '👷', label: 'Менеджер 1', labelUz: 'Menejer 1', desc: 'Свои заявки', descUz: 'O\'z arizalari' },
  { login: 'manager2', password: '123', emoji: '🧑‍🔧', label: 'Менеджер 2', labelUz: 'Menejer 2', desc: 'Свои заявки', descUz: 'O\'z arizalari' },
];

export const Login = () => {
  const { login } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelect = (idx: number) => {
    setSelected(idx);
    setError('');
  };

  const handleLogin = async () => {
    if (selected === null) {
      setError(lang === 'ru' ? 'Выберите роль для входа' : 'Kirish uchun rolni tanlang');
      return;
    }
    setLoading(true);
    const role = ROLES[selected];
    const ok = login(role.login, role.password);
    if (ok) {
      navigate('/crm/clients', { replace: true });
    } else {
      setError(t('loginError'));
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="card">
          {/* Top row: back to landing + theme + lang */}
          <div className="login-header-row">
            <Link to="/" className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}>
              ← {lang === 'ru' ? 'На главную' : 'Bosh sahifaga'}
            </Link>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0.4rem 0.75rem' }}
                onClick={() => setLang(lang === 'ru' ? 'uz' : 'ru')}
              >
                {lang === 'ru' ? 'UZ' : 'RU'}
              </button>
              <button className="theme-btn" onClick={toggleTheme} title={theme === 'light' ? 'Ночной режим' : 'Дневной режим'}>
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>❄️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
              {lang === 'ru' ? 'Вход в систему' : 'Tizimga kirish'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {lang === 'ru' ? 'Выберите свою роль' : 'Rolingizni tanlang'}
            </p>
          </div>

          {/* Role cards */}
          <div className="role-cards">
            {ROLES.map((r, idx) => (
              <div
                key={r.login}
                className={`role-card ${selected === idx ? 'selected' : ''}`}
                onClick={() => handleSelect(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleSelect(idx)}
              >
                <div className="role-emoji">{r.emoji}</div>
                <div className="role-name">{lang === 'ru' ? r.label : r.labelUz}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {lang === 'ru' ? r.desc : r.descUz}
                </div>
              </div>
            ))}
          </div>

          {/* Password hint */}
          {selected !== null && (
            <div style={{
              background: 'var(--color-primary-light)',
              border: '1px solid rgba(200, 132, 42, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              🔑 {lang === 'ru' ? 'Пароль:' : 'Parol:'} <strong>123</strong>
              &nbsp;·&nbsp;
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'ru' ? ROLES[selected].label : ROLES[selected].labelUz}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Login button */}
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? '...' : (lang === 'ru' ? 'Войти' : 'Kirish')}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {lang === 'ru'
              ? 'Войдите чтобы управлять заявками, клиентами и задачами'
              : 'Arizalar, mijozlar va vazifalarni boshqarish uchun kiring'}
          </p>
        </div>
      </div>
    </div>
  );
};
