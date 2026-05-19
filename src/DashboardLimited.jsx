import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  BarChart3,
} from 'lucide-react';

import './dashboard.css';
import {
  getCompany,
  getCompanyEmployees,
} from './api';

export default function DashboardLimited() {

  const navigate = useNavigate();

  const rawUser =
    localStorage.getItem('user');

  const user =
    rawUser
      ? JSON.parse(rawUser)
      : null;

  // 🔥 ID EMPRESA
  const companyId =
    user?.companyId ||
    user?.company?.id ||
    user?.memberships?.[0]?.companyId;

  // 🔥 COMPANY
  const [company, setCompany] =
    useState(null);

  // 🔥 EMPLOYEES
  const [employees, setEmployees] =
    useState([]);

  useEffect(() => {

    async function loadCompany() {

      if (!companyId) return;

      try {

        const data =
          await getCompany(companyId);

        console.log(
          '🏢 COMPANY:',
          data
        );

        setCompany(data);

      } catch (e) {

        console.error(
          'Error cargando company',
          e
        );
      }
    }

    loadCompany();

  }, [companyId]);

  // 🔥 LOAD EMPLOYEES
  useEffect(() => {

    async function loadEmployees() {

      if (!companyId) return;

      try {

        const data =
          await getCompanyEmployees(
            companyId
          );

        console.log(
          '👥 EMPLOYEES:',
          data
        );

        setEmployees(data);

      } catch (e) {

        console.error(
          'Error cargando empleados',
          e
        );
      }
    }

    loadEmployees();

  }, [companyId]);

  /*
  |--------------------------------------------------------------------------
  | FIRST EMPLOYEE
  |--------------------------------------------------------------------------
  */

  const firstEmployee =
    employees?.[0];

  /*
  |--------------------------------------------------------------------------
  | OPTIONS
  |--------------------------------------------------------------------------
  */

  const activeOptions = [
    {
      label: 'Informes',
      icon: <BarChart3 size={34} />,

      onClick: () => {

        if (!firstEmployee) return;

        navigate(
          `/admin/employees/${firstEmployee.id}/reports`
        );
      },
    },
  ];

  const disabledOptions = [];

  /*
  |--------------------------------------------------------------------------
  | SUPERADMIN
  |--------------------------------------------------------------------------
  */

  if (user?.role === 'SUPERADMIN') {

    disabledOptions.push(
      {
        label: 'Empresas',
        icon: <Building2 size={34} />,
      },
      {
        label: 'Sucursales',
        icon: <Building2 size={34} />,
      },
      {
        label: 'Empleados',
        icon: <Users size={34} />,
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN EMPRESA
  |--------------------------------------------------------------------------
  */

  else if (
    user?.role === 'ADMIN_EMPRESA'
  ) {

    disabledOptions.push(
      {
        label: 'Sucursales',
        icon: <Building2 size={34} />,
      },
      {
        label: 'Empleados',
        icon: <Users size={34} />,
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN SUCURSAL
  |--------------------------------------------------------------------------
  */

  else if (
    user?.role === 'ADMIN_SUCURSAL'
  ) {

    disabledOptions.push(
      {
        label: 'Empleados',
        icon: <Users size={34} />,
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EMPLEADO
  |--------------------------------------------------------------------------
  */

  if (user?.role === 'EMPLEADO') {

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
            boxShadow:
              '0 10px 30px rgba(0,0,0,0.06)',
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

  return (

    <div className="dashboard-tablet">

      {/* 🔥 BANNER */}
      <div
        style={{
          marginBottom: 24,

          padding: 20,

          borderRadius: 18,

          background: '#fff7ed',

          border:
            '1px solid #fdba74',

          color: '#9a3412',

          textAlign: 'center',
        }}
      >

        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Tu periodo de prueba ha finalizado
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            marginBottom: 18,
          }}
        >
          Puedes seguir consultando
          informes y acceder a tu perfil,
          pero las funcionalidades
          operativas de Timeo están
          temporalmente bloqueadas.
        </div>

        <button
          className="dashboard-card"
          onClick={() =>
            navigate('/admin/billing')
          }
          style={{
            padding: '8px 18px',
            fontSize: 14,
          }}
        >
          Activar plan
        </button>

      </div>

      {/* TITLE */}
      <h2 className="dashboard-title">
        Inicio
      </h2>

      {/* GRID */}
      <div className="dashboard-grid">

        {/* 🔥 ACTIVOS */}
        {activeOptions.map((opt, i) => (

          <button
            key={i}
            className="dashboard-card"
            onClick={opt.onClick}
          >
            {opt.icon}

            <span>
              {opt.label}
            </span>

          </button>

        ))}

        {/* 🔒 BLOQUEADOS */}
        {disabledOptions.map((opt, i) => (

          <button
            key={`disabled-${i}`}
            className="dashboard-card"
            disabled
            style={{
              opacity: 0.4,
              cursor: 'not-allowed',
              filter: 'grayscale(1)',
            }}
          >
            {opt.icon}

            <span>
              {opt.label}
            </span>

          </button>

        ))}

      </div>

      <footer className="dashboard-footer">
        © Timeo
      </footer>

    </div>
  );
}