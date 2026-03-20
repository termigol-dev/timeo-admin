import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Logo from "./components/Logo";
import {
  LayoutDashboard,
  User,
  LogOut,
  Moon,
} from 'lucide-react';

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

      {/* ================= HEADER ================= */}
      <header className="header">

        {/* IZQUIERDA → DASHBOARD */}
        <div className="header-left">
          <button
            className="header-btn"
            onClick={() => navigate('/admin/dashboard')}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </button>
        </div>

        {/* CENTRO → LOGO */}
        <div className="header-center">
          <Logo dark={dark} size={90} />
        </div>

        {/* DERECHA → ACCIONES */}
        <div className="header-right">

          {/* MODO OSCURO */}
          <button
            className="header-btn"
            onClick={() => setDark(d => !d)}
          >
            <Moon />
          </button>

          {/* PERFIL */}
          <button
            className="header-btn"
            onClick={() => {
              if (!user?.id) return;
              navigate(`/admin/users/${user.id}/profile`);
            }}
          >
            <User />
          </button>

          {/* LOGOUT */}
          <button
            className="header-btn logout"
            onClick={logout}
          >
            <LogOut />
          </button>

        </div>

      </header>

      {/* ================= CONTENIDO ================= */}
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>

    </div>
  );
}