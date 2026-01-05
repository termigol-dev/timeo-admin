import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminLayout from './AdminLayout';
import './style.css';

/* 🔽 IMPORTS DE LAS PÁGINAS ADMIN */
import Dashboard from './Dashboard';
import Companies from './Companies';
import CompanyProfile from './CompanyProfile';
import Employees from './Employees';
import Branches from './Branches';
import Reports from './Reports';
import Profile from './Profile';
import NewCompany from './NewCompany';
import NewBranch from './NewBranch';
import CreateUser from './CreateUser';

export default function App() {
  const [dark, setDark] = useState(
    localStorage.getItem('dark_mode') === 'true'
  );

  const [logged, setLogged] = useState(
    !!localStorage.getItem('token')
  );

  /* 🌙 modo oscuro */
  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('dark_mode', dark);
  }, [dark]);

  /* 🔁 sincronizar login */
  useEffect(() => {
    const checkToken = () => {
      setLogged(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', checkToken);
    return () =>
      window.removeEventListener('storage', checkToken);
  }, []);

  return (
    <Routes>
      {/* ───────── NO LOGUEADO ───────── */}
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
            path="/admin"
            element={
              <AdminLayout
                dark={dark}
                setDark={setDark}
                onLogout={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  setLogged(false);
                }}
              />
            }
          >
            {/* DASHBOARD */}
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* EMPRESAS */}
            <Route path="companies" element={<Companies />} />
            <Route path="companies/new" element={<NewCompany />} />
            <Route
              path="companies/:companyId"
              element={<CompanyProfile />}
            />

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
              element={<CreateUser defaultRole="EMPLEADO" />}
            />

            {/* REPORTES Y PERFIL */}
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
          </Route>

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