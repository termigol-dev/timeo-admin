import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminLayout from './AdminLayout';
import './style.css';

/* 🔽 PÁGINAS ADMIN */
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
import EmployeeSchedules from './EmployeeSchedules';

export default function App() {
  const [dark, setDark] = useState(
    localStorage.getItem('dark_mode') === 'true'
  );

  const [logged, setLogged] = useState(
    !!localStorage.getItem('token')
  );

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();

  /* 🌙 MODO OSCURO */
  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('dark_mode', dark);
  }, [dark]);

  /* 🔁 SINCRONIZAR LOGIN ENTRE PESTAÑAS */
  useEffect(() => {
    const checkToken = () => {
      setLogged(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', checkToken);
    return () =>
      window.removeEventListener('storage', checkToken);
  }, []);

  /* 🚫 BLOQUEO EXPLÍCITO DE EMPLEADOS EN ADMIN */
  if (logged && user?.role === 'EMPLEADO') {
    return (
      <div className="centered">
        <div className="card">
          <h2>Acceso no permitido</h2>
          <p>
            Este panel es solo para administradores.
            <br />
            Accede desde la aplicación móvil.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              setLogged(false);
            }}
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

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

      {/* ───────── LOGUEADO (ADMIN / SUPERADMIN) ───────── */}
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
            <Route
            path="companies/:companyId/employees/:employeeId/schedules"
            element={<EmployeeSchedules />}
            />
            {/* REPORTES Y PERFIL */}
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* FALLBACK SOLO ADMIN */}
          <Route
            path="*"
            element={<Navigate to="/admin" replace />}
          />
        </>
      )}
    </Routes>
  );
}