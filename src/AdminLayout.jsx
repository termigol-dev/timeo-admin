import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileBarChart,
  User,
  LogOut,
  Moon,
} from 'lucide-react';

import Dashboard from './Dashboard';
import Companies from './Companies';
import CompanyProfile from './CompanyProfile';
import Employees from './Employees';
import Branches from './Branches';
import Reports from './Reports';
import Profile from './Profile';
import { can } from './permissions';
import NewCompany from './NewCompany';
import NewBranch from './NewBranch';
import NewEmployee from './NewEmployee';

export default function AdminLayout({ dark, setDark, onLogout }) {
  const navigate = useNavigate();

  const rawUser = localStorage.getItem('admin_user');
  const user = rawUser ? JSON.parse(rawUser) : null;

  function logout() {
    onLogout(); // 🔑 App.jsx controla el login
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
            <button onClick={() => navigate('dashboard')}>
              <LayoutDashboard />
              <span>Dashboard</span>
            </button>
          )}

          {can(user.role, 'companies') && (
            <button onClick={() => navigate('companies')}>
              <Building2 />
              <span>Empresas</span>
            </button>
          )}

          {can(user.role, 'employees') && (
            <button onClick={() => navigate('companies')}>
              <Users />
              <span>Empleados</span>
            </button>
          )}

          {can(user.role, 'reports') && (
            <button onClick={() => navigate('reports')}>
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
          <button onClick={() => navigate('profile')}>
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
      <main className="main">
        <Routes>
          {/* DASHBOARD */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* EMPRESAS */}
          <Route path="companies" element={<Companies />} />
          <Route path="companies/new" element={<NewCompany />} />
          <Route path="companies/:companyId" element={<CompanyProfile />} />

          {/* SUCURSALES */}
          <Route
            path="companies/:companyId/branches"
            element={<Branches />}
          />
          <Route
            path="companies/:companyId/branches/new"
            element={<NewBranch />}
          />

          {/* EMPLEADOS */}
          <Route
            path="companies/:companyId/employees"
            element={<Employees />}
          />
          <Route
            path="companies/:companyId/employees/new"
            element={<NewEmployee />}
          />

          {/* REPORTES Y PERFIL */}
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}