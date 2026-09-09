import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getClients, addClient, updateClient, getClientByPhone, getRequests } from '../store';
import { Client, CRMRequest } from '../types';
import { Modal } from '../components/Modal';
import { Plus, Search, Edit2, FileText, Calendar, Phone, MapPin, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { formatPhone, cleanPhone } from '../utils/formatters';
import { exportClientsToCSV } from '../utils/exportToExcel';

export const Clients = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [requests, setRequests] = useState<CRMRequest[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'requests'>('info');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [dupClient, setDupClient] = useState<Client | null>(null);

  const refreshData = () => {
    setClients([...getClients()].reverse());
    let reqs = getRequests();
    if (user?.role === 'manager') {
      reqs = reqs.filter(r => r.managerId === user.id);
    }
    setRequests(reqs.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    refreshData();

    const handleOpenModalEvent = () => handleOpenModal();
    window.addEventListener('openClientModal', handleOpenModalEvent);
    window.addEventListener('crm_store_updated', refreshData);
    return () => {
      window.removeEventListener('openClientModal', handleOpenModalEvent);
      window.removeEventListener('crm_store_updated', refreshData);
    };
  }, [user]);

  const handleOpenModal = (client?: Client) => {
    setActiveTab('info');
    if (client) {
      setEditingClient(client);
      setName(client.name);
      setPhone(client.phone);
      setAddress(client.address || '');
      setComment(client.comment || '');
    } else {
      setEditingClient(null);
      setName('');
      setPhone('');
      setAddress('');
      setComment('');
    }
    setError('');
    setDupClient(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError(t('requiredField'));
      return;
    }

    if (!editingClient) {
      const existing = getClientByPhone(phone.trim());
      if (existing) {
        setDupClient(existing);
        return;
      }
      addClient({ name, phone, address, comment });
    } else {
      updateClient(editingClient.id, { name, phone, address, comment });
    }

    setClients([...getClients()].reverse());
    setIsModalOpen(false);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{t('clients')}</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
            onClick={() => exportClientsToCSV(filteredClients, requests, 'baza_klientov')}
            title="Выгрузить базу клиентов в Excel (CSV)"
          >
            <Download size={15} />
            <span>{lang === 'ru' ? 'Экспорт в Excel' : 'Excelga eksport'}</span>
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> {t('add')}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              style={{ paddingLeft: '2.5rem', width: '100%', maxWidth: '400px' }} 
              placeholder={t('search')} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('name')}</th>
              <th>{t('phone')}</th>
              <th>{t('address')}</th>
              <th style={{ width: '80px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => (
              <tr key={client.id}>
                <td style={{ fontWeight: 500 }}>{client.name}</td>
                <td>
                  <a href={`tel:${cleanPhone(client.phone)}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                    <Phone size={12} style={{ marginRight: '0.25rem' }} />{client.phone}
                  </a>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {client.address ? (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(client.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                      <MapPin size={12} style={{ marginRight: '0.25rem' }} />{client.address}
                    </a>
                  ) : '-'}
                </td>
                <td>
                  <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleOpenModal(client)}>
                    <Edit2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  {t('notFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? t('clients') : t('add')}>
        {editingClient && (
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <button 
              style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'info' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'info' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer' }}
              onClick={() => setActiveTab('info')}
            >
              Инфо
            </button>
            <button 
              style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'requests' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'requests' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer' }}
              onClick={() => setActiveTab('requests')}
            >
              {t('requests')} ({requests.filter(r => r.clientId === editingClient.id).length})
            </button>
          </div>
        )}

        {activeTab === 'info' && (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">{t('name')} *</label>
              <input className="input-field" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">{t('phone')} *</label>
              <input className="input-field" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} required />
            </div>
            <div className="input-group">
              <label className="input-label">{t('address')}</label>
              <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">{t('comment')}</label>
              <textarea className="input-field" value={comment} onChange={e => setComment(e.target.value)} rows={3} />
            </div>
            {/* Duplicate phone warning */}
            {dupClient && (
              <div style={{
                background: 'rgba(200,132,42,0.1)',
                border: '1.5px solid rgba(200,132,42,0.45)',
                borderRadius: 'var(--radius-md)',
                padding: '0.875rem 1rem',
                marginBottom: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>
                    <strong style={{ color: 'var(--color-primary)' }}>{t('phone')}</strong>
                    {' '}{t('alreadyExists') || 'уже используется клиентом:'}{' '}
                    <strong>{dupClient.name}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
                    onClick={() => { setDupClient(null); handleOpenModal(dupClient); }}
                  >
                    {t('openClient') || 'Открыть клиента'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
                    onClick={() => setDupClient(null)}
                  >
                    {t('cancel') || 'Отмена'}
                  </button>
                </div>
              </div>
            )}
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

        {activeTab === 'requests' && editingClient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              className="btn btn-outline" 
              style={{ marginBottom: '1rem', justifyContent: 'center', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              onClick={() => {
                navigate('/crm/requests', { state: { createForClient: editingClient.id } });
                setTimeout(() => window.dispatchEvent(new CustomEvent('openRequestModal')), 100);
              }}
            >
              {t('createRequest')}
            </button>
            {requests.filter(r => r.clientId === editingClient.id).map(r => (
              <div key={r.id} className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <Link to="/requests" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{r.id}</Link>
                  <span className={`badge badge-${r.status.replace('_', '-')}`}>{t('status' + r.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''))}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={12} /> {format(r.createdAt, 'dd.MM.yyyy')}
                </div>
              </div>
            ))}
            {requests.filter(r => r.clientId === editingClient.id).length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('notFound')}</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
