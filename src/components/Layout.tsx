import React, { useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Users, FileText, CheckSquare, BarChart3, LogOut, Download, Upload, RefreshCw, Plus, Calendar, UserCheck } from 'lucide-react';
import { exportData, importData, resetToDemoData, getTasks, getRequests } from '../store';

export const Layout = () => {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recalculate tasks count on every render (which happens on route change)
  const allTasks = getTasks();
  const allRequests = getRequests();
  let pendingTasks = 0;
  let overdueTasks = 0;
  
  if (user) {
    let myTasks = allTasks.filter(t => !t.isDone);
    if (user.role === 'manager') {
      const myRequestIds = new Set(allRequests.filter(r => r.managerId === user.id).map(r => r.id));
      myTasks = myTasks.filter(t => t.assigneeId === user.id && myRequestIds.has(t.requestId));
    }
    pendingTasks = myTasks.length;
    overdueTasks = myTasks.filter(t => t.dueDate < Date.now()).length;
  }

  const navItems = [
    { path: '/crm/clients', label: t('clients'), icon: <Users size={18} /> },
    { path: '/crm/requests', label: t('requests'), icon: <FileText size={18} /> },
    { path: '/crm/calendar', label: lang === 'ru' ? 'График' : 'Taqvim', icon: <Calendar size={18} /> },
    { path: '/crm/tasks', label: t('myTasks'), icon: <CheckSquare size={18} />, count: pendingTasks, overdue: overdueTasks > 0 },
  ];
  if (user?.role === 'boss') {
    navItems.push({ path: '/crm/dashboard', label: t('dashboard'), icon: <BarChart3 size={18} /> });
    navItems.push({ path: '/crm/team', label: lang === 'ru' ? 'Сотрудники' : 'Xodimlar', icon: <UserCheck size={18} /> });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      importData(e.target.files[0], () => {
        alert('Данные успешно восстановлены');
        window.location.reload();
      }, (err) => alert(err));
    }
  };

  const handleReset = () => {
    if (window.confirm('Вы уверены, что хотите сбросить систему к демо-данным? Все текущие изменения будут потеряны.')) {
      resetToDemoData();
      window.location.reload();
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
            <div className="sidebar-logo-icon">❄️</div>
            AirCondition
          </Link>
          <div className="sidebar-user">
            {user?.login} · {user?.role === 'boss' ? (lang === 'ru' ? 'Руководитель' : 'Rahbar') : (lang === 'ru' ? 'Менеджер' : 'Menejer')}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span style={{ 
                  backgroundColor: item.overdue ? 'var(--color-danger)' : 'var(--color-primary)', 
                  color: 'white', 
                  fontSize: '0.75rem', 
                  padding: '0.1rem 0.4rem', 
                  borderRadius: '1rem',
                  fontWeight: 'bold'
                }}>
                  {item.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <button className="btn btn-ghost" onClick={() => setLang(lang === 'ru' ? 'uz' : 'ru')} style={{ flex: 1, padding: '0.5rem' }}>
              🌐 {lang === 'ru' ? 'UZ' : 'RU'}
            </button>
            <button className="btn btn-ghost" onClick={toggleTheme} title={theme === 'light' ? 'Ночной режим' : 'Дневной режим'} style={{ flex: 1, padding: '0.5rem' }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <button className="btn btn-outline" onClick={exportData} title={t('backup')} style={{ flex: 1, padding: '0.5rem' }}>
              <Download size={16} />
            </button>
            <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} title={t('restore')} style={{ flex: 1, padding: '0.5rem' }}>
              <Upload size={16} />
            </button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleImport} />
            <button className="btn btn-outline" onClick={handleReset} title={t('demoData')} style={{ flex: 1, padding: '0.5rem' }}>
              <RefreshCw size={16} />
            </button>
          </div>

          <button
            className="btn btn-outline"
            onClick={handleLogout}
            style={{ width: '100%', justifyContent: 'center', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
        
        {/* Floating Action Button for Mobile */}
        <div className="fab-container">
          <button 
            className="fab-button"
            onClick={() => {
              if (location.pathname.includes('/clients')) {
                // Open add client modal. It's inside Clients component.
                // We'll dispatch a custom event to trigger it.
                window.dispatchEvent(new CustomEvent('openClientModal'));
              } else {
                navigate('/crm/requests');
                setTimeout(() => window.dispatchEvent(new CustomEvent('openRequestModal')), 100);
              }
            }}
          >
            <Plus size={24} />
          </button>
        </div>
      </main>
    </div>
  );
};
