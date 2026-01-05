import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  FileBarChart,
  User,
} from 'lucide-react';
import './dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-tablet">
      <h2 className="dashboard-title">Panel de administración</h2>

      <div className="dashboard-grid">
        <button
          className="dashboard-card"
          onClick={() => navigate('/admin/employees')}
        >
          <Users size={32} />
          <span>Empleados</span>
        </button>

        <button
          className="dashboard-card"
          onClick={() => navigate('/admin/companies')}
        >
          <Building2 size={32} />
          <span>Empresas</span>
        </button>

        <button
          className="dashboard-card"
          onClick={() => navigate('/admin/reports')}
        >
          <FileBarChart size={32} />
          <span>Informes</span>
        </button>

        <button
          className="dashboard-card"
          onClick={() => navigate('/admin/profile')}
        >
          <User size={32} />
          <span>Perfil</span>
        </button>
      </div>

      <footer className="dashboard-footer">© Timeo</footer>
    </div>
  );
}