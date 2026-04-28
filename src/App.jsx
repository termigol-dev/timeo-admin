import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './Login';
import AdminLayout from './AdminLayout';
import './style.css';

/* 🔽 PÁGINAS ADMIN */
import Dashboard from './Dashboard';
import Companies from './Companies';
import CompanyProfile from './CompanyProfile';
import Employees from './Employees';
import EmployeesList from './EmployeesList';
import Branches from './Branches';
import Reports from './Reports';
import Profile from './Profile';
import NewCompany from './NewCompany';
import NewBranch from './NewBranch';
import CreateUser from './CreateUser';
import EmployeeSchedules from './EmployeeSchedules';
import Register from './Register';
import SimulateRecord from './SimulateRecord';
import SendPushTest from './SendPushTest.jsx';
import ScrollToTop from './ScrollToTop';
import PrivateRoute from './components/PrivateRoute';

export default function App() {

  const [dark, setDark] = useState(
    localStorage.getItem('dark_mode') === 'true'
  );

  // 🔐 NUEVO: estado controlado de auth  
  const [logged, setLogged] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();
  console.log('🧪 USER EN APP:', user);
  /* 🌙 MODO OSCURO */
  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('dark_mode', dark);
  }, [dark]);

  /* 🔐 CHECK INICIAL DE AUTH (CLAVE) */
  useEffect(() => {
    const token = localStorage.getItem('token');
    setLogged(!!token);
    setAuthChecked(true);
  }, []);

  /* 🔁 SINCRONIZAR LOGIN ENTRE PESTAÑAS */
  useEffect(() => {
    const checkToken = () => {
      setLogged(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', checkToken);
    return () =>
      window.removeEventListener('storage', checkToken);
  }, []);

  useEffect(() => {
    if (!logged) return;

    // 👉 SIEMPRE entrar por inicio
    if (window.location.pathname !== '/admin') {
      navigate('/admin', { replace: true });
    }
  }, [logged]);


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

  // 🔴 CLAVE: NO renderizar nada hasta saber auth  
  if (!authChecked) return null;

  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route path="/register" element={<Register />} />

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

        {/* ───────── LOGUEADO ───────── */}
        {logged && (
          <>
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminLayout
                    dark={dark}
                    setDark={setDark}
                    onLogout={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      setLogged(false);
                    }}
                  />
                </PrivateRoute>
              }
            >
              <Route path="push-test" element={<SendPushTest />} />
              <Route path="/admin/dev/simulate" element={<SimulateRecord />} />

              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />

              <Route path="employees" element={<EmployeesList />} />

              <Route path="companies" element={<Companies />} />
              <Route path="companies/new" element={<NewCompany />} />
              <Route path="companies/:companyId" element={<CompanyProfile />} />

              <Route path="companies/:companyId/branches" element={<Branches />} />
              <Route path="companies/:companyId/branches/new" element={<NewBranch />} />

              <Route path="companies/:companyId/employees" element={<Employees />} />
              <Route path="companies/:companyId/employees/new" element={<CreateUser defaultRole="EMPLEADO" />} />

              <Route path="companies/:companyId/employees/:employeeId/schedules" element={<EmployeeSchedules />} />
              <Route path="employees/:employeeId/schedules" element={<EmployeeSchedules />} />

              <Route path="users/:userId/profile" element={<Profile />} />

              <Route
                path="profile"
                element={
                  user?.id
                    ? <Navigate to={`/admin/users/${user.id}/profile`} replace />
                    : <Navigate to="/admin" replace />
                }
              />
            </Route>

            {/* 🔥 PROTEGIDO TAMBIÉN */}
            <Route
              path="/admin/employees/:userId/reports"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />

            <Route
              path="*"
              element={<Navigate to="/admin" replace />}
            />
          </>
        )}
      </Routes>

      {/* 🔥 OVERLAY (ESTO ES LO ÚNICO NUEVO) */}
      {logged && !user?.companyId && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ marginBottom: 12 }}>
              Bienvenido a Timeo 👋
            </h2>

            <p style={{ marginBottom: 24 }}>
              Para empezar necesitas crear una empresa.
            </p>

            <div className="tablet-actions" style={{ justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/admin/companies/new')}
              >
                Crear empresa
              </button>

              <button
                onClick={() => {
                  localStorage.clear();
                  setLogged(false);
                }}
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ======================================================
         MODALES CREAR EMPRESA USUARIO NUEVO   
====================================================== */


const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const modalStyle = {
  background: '#fff',
  padding: 32,
  borderRadius: 20,
  width: '90%',
  maxWidth: 500,
  textAlign: 'center',
};