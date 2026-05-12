import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
} from 'lucide-react';
import './dashboard.css';
import { getCompany } from './api';

export default function Dashboard() {

  const navigate = useNavigate();

  const rawUser = localStorage.getItem('user');
  const user = rawUser ? JSON.parse(rawUser) : null;

  // 🔥 ID de empresa
  const companyId =
    user?.companyId ||
    user?.company?.id ||
    user?.memberships?.[0]?.companyId;

  // 🔥 estado de company
  const [company, setCompany] = useState(null);



  // 🔥 cargar company REAL
  useEffect(() => {
    async function loadCompany() {
      if (!companyId) return;

      try {
        const data = await getCompany(companyId);
        console.log('🏢 COMPANY:', data);
        setCompany(data);
      } catch (e) {
        console.error('Error cargando company', e);
      }
    }

    loadCompany();
  }, [companyId]);

  // 🔥 TRIAL
  const trialEnd = company?.trialEnd;

  let daysLeft = null;

  if (trialEnd) {
    const diff = new Date(trialEnd) - new Date();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // 🔥 ESTILO DINÁMICO
  const getTrialStyle = () => {
    if (daysLeft <= 3) {
      return { background: '#fee2e2', color: '#991b1b' }; // rojo
    }
    if (daysLeft <= 7) {
      return { background: '#ffedd5', color: '#9a3412' }; // naranja
    }
    return { background: '#fef3c7', color: '#92400e' }; // amarillo
  };

  const trialStyle = daysLeft !== null ? getTrialStyle() : {};

  console.log('🧠 ROLE DETECTADO:', user?.role);

  let options = [];

  /* ==============================
     SUPERADMIN
  ============================== */

  if (user?.role === 'SUPERADMIN') {

    console.log('🟣 RENDER: SUPERADMIN');

    options = [
      {
        label: 'Empresas',
        icon: <Building2 size={34} />,
        onClick: () => navigate('/admin/companies'),
      },
      {
        label: 'Sucursales',
        icon: <Building2 size={34} />,
        onClick: () => navigate('/admin/branches'),
      },
      {
        label: 'Empleados',
        icon: <Users size={34} />,
        onClick: () => navigate('/admin/employees'),
      },
    ];
  }

  /* ==============================
     ADMIN EMPRESA
  ============================== */

  else if (user?.role === 'ADMIN_EMPRESA') {

    console.log('🔵 RENDER: ADMIN_EMPRESA');

    options = [
      {
        label: 'Sucursales',
        icon: <Building2 size={34} />,
        onClick: () => navigate('/admin/branches'),
      },
      {
        label: 'Empleados',
        icon: <Users size={34} />,
        onClick: () => navigate('/admin/employees'),
      },
    ];
  }

  /* ==============================
     ADMIN SUCURSAL
  ============================== */

  else if (user?.role === 'ADMIN_SUCURSAL') {

    console.log('🟢 RENDER: ADMIN_SUCURSAL');

    options = [
      {
        label: 'Empleados',
        icon: <Users size={34} />,
        onClick: () => navigate('/admin/employees'),
      },
    ];
  }

  /* ==============================
     EMPLEADO
  ============================== */

  else if (user?.role === 'EMPLEADO') {

    console.log('🟠 EMPLEADO SIN ACCESO');

    return (
      <div className="dashboard-tablet">

        <div
          style={{
            maxWidth: 500,
            margin: '120px auto',
            background: 'white',
            borderRadius: 24,
            padding: 40,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          }}
        >

          <h2
            style={{
              marginTop: 0,
              color: '#0f172a',
            }}
          >
            Acceso no disponible
          </h2>

          <p
            style={{
              color: '#64748b',
              lineHeight: 1.7,
            }}
          >
            Este panel está reservado para
            administradores de empresa y sucursal.
          </p>

        </div>

      </div>
    );
  }

  /* ==============================
     NO ROLE
  ============================== */

  else {

    console.log('❌ ROL NO CONTROLADO:', user?.role);

  }
  return (

    <div className="dashboard-tablet">

      {/* 🔥 TRIAL BANNER */}
      {daysLeft !== null && (
        <div style={{
          marginBottom: 20,
          padding: 12,
          borderRadius: 10,
          fontWeight: 600,
          textAlign: 'center',
          ...trialStyle
        }}>
          🟡 Periodo de prueba · Te quedan {daysLeft} días para activar tu plan
          <br />
          <span style={{ fontSize: 13, fontWeight: 400 }}>
            Añade un método de pago para no perder acceso
          </span>
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => navigate('/admin/billing')}
              className="dashboard-card"
              style={{
                padding: '6px 14px',
                fontSize: 14
              }}
            >
              Activar plan
            </button>
          </div>
        </div>
      )}

      <h2 className="dashboard-title">
        Inicio
      </h2>

      <div className="dashboard-grid">
        {options.map((opt, i) => (
          <button
            key={i}
            className="dashboard-card"
            onClick={opt.onClick}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <footer className="dashboard-footer">
        © Timeo
      </footer>

    </div>
  );
}