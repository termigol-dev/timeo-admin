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
    <div className="app-container"> {/* 👈 NUEVO CONTENEDOR */}

      {/* ================= HEADER ================= */}
      <header className="header">

        <div className="header-left">
          <button
            className="header-btn"
            onClick={() => navigate('/admin/dashboard')}
          >
            <LayoutDashboard />
            <span></span>
          </button>
        </div>

        <div className="header-center">
          <Logo dark={dark} size={130} /> {/* un poco más pequeño */}
        </div>

        <div className="header-right">

          <button
            className="header-btn"
            onClick={() => setDark(d => !d)}
          >
            <Moon />
          </button>

          <button
            className="header-btn"
            onClick={() => {
              if (!user?.id) return;
              navigate(`/admin/users/${user.id}/profile`);
            }}
          >
            <User />
          </button>

          <button
            className="header-btn logout"
            onClick={logout}
          >
            <LogOut />
          </button>

        </div>

      </header>

      {/* ================= CONTENIDO ================= */}
      <main className="page-content">
        <Outlet />
      </main>

    </div>
  );
}