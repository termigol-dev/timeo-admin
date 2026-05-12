import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import Billing from './Billing';
import MyProfile from './MyProfile';

export default function App() {

  const [dark, setDark] = useState(
    localStorage.getItem('dark_mode') === 'true'
  );

  const [logged, setLogged] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const navigate = useNavigate();
  const location = useLocation(); // 👈 NUEVO

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();

  console.log('🧪 USER EN APP:', user);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('dark_mode', dark);
  }, [dark]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLogged(!!token);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    const checkToken = () => {
      setLogged(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', checkToken);
    return () =>
      window.removeEventListener('storage', checkToken);
  }, []);

  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const step = localStorage.getItem('onboarding_step');

    if (step === 'company_created' && user?.companyId) {
      setShowWelcome(true);
      localStorage.removeItem('onboarding_step');
    }
  }, [user]);

  useEffect(() => {
    if (!logged) return;

    if (window.location.pathname !== '/admin') {
      navigate('/admin', { replace: true });
    }
  }, [logged]);

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

  if (!authChecked) return null;

  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route path="/register" element={<Register />} />

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

              <Route path="/admin/billing" element={<Billing />} />

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

            <Route
              path="/admin/my-profile"
              element={<MyProfile />}
            />

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

      {/* 🔥 OVERLAY CORREGIDO */}
      {logged && !user?.companyId && !location.pathname.includes('/companies/new') && (
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
      {showWelcome && user?.companyId && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ marginBottom: 12 }}>
              🎉 ¡Enhorabuena!
            </h2>

            <p style={{ marginBottom: 12 }}>
              Has dado de alta tu empresa y comienza tu periodo de prueba.
            </p>

            <p style={{ marginBottom: 24 }}>
              ¿Quieres crear tu primer empleado y empezar a probar Timeo?
            </p>

            <div className="tablet-actions" style={{ justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowWelcome(false);
                  navigate(`/admin/companies/${user.companyId}/employees/new`);
                }}
              >
                Sí
              </button>

              <button
                onClick={() => setShowWelcome(false)}
              >
                No, ir al inicio
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