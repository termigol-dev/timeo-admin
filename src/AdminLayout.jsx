import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileBarChart,
  User,
  LogOut,
  Moon,
} from 'lucide-react';

import { can } from './permissions';

export default function AdminLayout({ dark, setDark, onLogout }) {
  const navigate = useNavigate();

  const rawUser = localStorage.getItem('user');
  const user = rawUser ? JSON.parse(rawUser) : null;

  function logout() {
    onLogout();
  }

  if (!user) return null;

  return (
    <div className="app">
      <header className="header">
        {/* LOGO */}
        <div className="logo">
          t<span>i</span>meo
        </div>

        {/* NAV PRINCIPAL */}
        <nav className="nav">
          {can(user.role, 'dashboard') && (
            <button onClick={() => navigate('/admin/dashboard')}>
              <LayoutDashboard />
              <span>Dashboard</span>
            </button>
          )}

          {can(user.role, 'companies') && (
            <button onClick={() => navigate('/admin/companies')}>
              <Building2 />
              <span>Empresas</span>
            </button>
          )}

          {can(user.role, 'employees') && (
            <button onClick={() => navigate('/admin/companies')}>
              <Users />
              <span>Empleados</span>
            </button>
          )}

          {can(user.role, 'reports') && (
            <button onClick={() => navigate('/admin/reports')}>
              <FileBarChart />
              <span>Informes</span>
            </button>
          )}
        </nav>

        {/* ACCIONES DERECHA */}
        <label className="dark-toggle">
          <Moon />
          <input
            type="checkbox"
            checked={dark}
            onChange={() => setDark(d => !d)}
          />
          <span>Modo oscuro</span>
        </label>

        <div className="header-right">
          <button onClick={() => navigate('/admin/profile')}>
            <User />
            <span>Mi perfil</span>
          </button>

          <button className="logout" onClick={logout}>
            <LogOut />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}