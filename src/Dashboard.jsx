import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
} from 'lucide-react';
import './dashboard.css';

export default function Dashboard() {

  const navigate = useNavigate();
  
  const rawUser = localStorage.getItem('user');
  const user = rawUser ? JSON.parse(rawUser) : null;
  const companyId =
  user?.companyId ||
  user?.company?.id ||
  user?.memberships?.[0]?.companyId;
  console.log("🧠 ROLE DETECTADO:", user?.role);

  let options = [];

  if (user?.role === 'SUPERADMIN') {
    console.log("🟣 RENDER: SUPERADMIN");

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

  if (user?.role === 'SUPERADMIN') {
    console.log("🟣 RENDER: SUPERADMIN");

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

 else if (user?.role === 'ADMIN_EMPRESA') {
  console.log("🔵 RENDER: ADMIN_EMPRESA");

  options = [
    {
      label: 'Sucursales',
      icon: <Building2 size={34} />,
      onClick: () => {
        if (!companyId) {
          console.error('❌ No companyId');
          return;
        }
        navigate(`/admin/companies/${companyId}/branches`);
      },
    },
    {
      label: 'Empleados',
      icon: <Users size={34} />,
      onClick: () => navigate('/admin/employees'),
    },
  ];
}

  
  else if (user?.role === 'ADMIN_SUCURSAL') {
    console.log("🟢 RENDER: ADMIN_SUCURSAL");

    options = [
      {
        label: 'Empleados',
        icon: <Users size={34} />,
        onClick: () => navigate('/admin/employees'),
      },
    ];
  }

  else {
    console.log("❌ ROL NO CONTROLADO:", user?.role);
  }

  return (
    <div className="dashboard-tablet">

      {/* 👇 CAMBIO AQUÍ */}
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