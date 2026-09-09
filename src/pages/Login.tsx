import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError(lang === 'ru' ? 'Введите логин' : 'Loginni kiriting');
      return;
    }
    if (!password) {
      setError(lang === 'ru' ? 'Введите пароль' : 'Parolni kiriting');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(username.trim(), password);
    if (res.success) {
      navigate('/crm/clients', { replace: true });
    } else {
      setError(res.error || (lang === 'ru' ? 'Неверный логин или пароль' : "Noto'g'ri login yoki parol"));
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="card" style={{ padding: '2rem' }}>
          {/* Top row: back to landing + theme + lang */}
          <div className="login-header-row" style={{ marginBottom: '1.5rem' }}>
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

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ fontSize: '2.75rem', marginBottom: '0.5rem' }}>❄️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
              {lang === 'ru' ? 'Вход в систему' : 'Tizimga kirish'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {lang === 'ru' ? 'Авторизуйтесь для доступа к CRM' : 'CRM ga kirish uchun avtorizatsiyadan o\'ting'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Username */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>
                {lang === 'ru' ? 'Логин' : 'Login'}
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.6rem', width: '100%' }}
                  placeholder={lang === 'ru' ? 'Ваш логин' : 'Sizning loginingiz'}
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>
                {lang === 'ru' ? 'Пароль' : 'Parol'}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem', width: '100%' }}
                  placeholder={lang === 'ru' ? 'Ваш пароль' : 'Sizning parolingiz'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', padding: 0
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{
                background: 'rgba(220, 50, 50, 0.1)',
                border: '1px solid rgba(220, 50, 50, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--color-danger)',
                textAlign: 'center',
                animation: 'fadeIn 0.2s ease'
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', gap: '0.5rem' }}
              disabled={loading}
            >
              <span>{loading ? (lang === 'ru' ? 'Проверка...' : 'Tekshirilmoqda...') : (lang === 'ru' ? 'Войти в CRM' : 'CRM ga kirish')}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {lang === 'ru'
              ? 'Безопасное соединение с шифрованием данных'
              : 'Ma\'lumotlarni shifrlash bilan xavfsiz ulanish'}
          </p>
        </div>
      </div>
    </div>
  );
};
