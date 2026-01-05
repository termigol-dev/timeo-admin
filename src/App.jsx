import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminLayout from './AdminLayout';
import './style.css';

export default function App() {
  const [dark, setDark] = useState(
    localStorage.getItem('dark_mode') === 'true'
  );

  // 🔑 estado reactivo de login (SOLO ADMIN)
  const [logged, setLogged] = useState(
    !!localStorage.getItem('admin_token')
  );

  // 🌙 modo oscuro
  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('dark_mode', dark);
  }, [dark]);

  // 🔁 sincronizar login si el token cambia (otras pestañas)
  useEffect(() => {
    const checkToken = () => {
      setLogged(!!localStorage.getItem('admin_token'));
    };

    window.addEventListener('storage', checkToken);
    return () =>
      window.removeEventListener('storage', checkToken);
  }, []);

  return (
    <Routes>
      {/* ───────── NO LOGUEADO (ADMIN) ───────── */}
      {!logged && (
        <Route
          path="*"
          element={
            <Login
              dark={dark}
              setDark={setDark}
              onLogin={() => setLogged(true)}
            />
          }
        />
      )}

      {/* ───────── LOGUEADO (ADMIN) ───────── */}
      {logged && (
        <>
          <Route
            path="/admin/*"
            element={
              <AdminLayout
                dark={dark}
                setDark={setDark}
                onLogout={() => {
                  localStorage.removeItem('admin_token');
                  localStorage.removeItem('admin_user');
                  setLogged(false);
                }}
              />
            }
          />

          {/* fallback SOLO ADMIN */}
          <Route
            path="*"
            element={<Navigate to="/admin" replace />}
          />
        </>
      )}
    </Routes>
  );
}