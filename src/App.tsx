import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Clients } from './pages/Clients';
import { Requests } from './pages/Requests';
import { Tasks } from './pages/Tasks';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { Team } from './pages/Team';

// Guard for protected CRM routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Navigate to="/crm/clients" replace /> : <Login />} />

        {/* Protected CRM routes */}
        <Route path="/crm" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/crm/clients" replace />} />
          <Route path="clients" element={<Clients />} />
          <Route path="requests" element={<Requests />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="dashboard" element={
            user?.role === 'boss' ? <Dashboard /> : <Navigate to="/crm/clients" replace />
          } />
          <Route path="team" element={
            user?.role === 'boss' ? <Team /> : <Navigate to="/crm/clients" replace />
          } />
          <Route path="*" element={<Navigate to="/crm/clients" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
