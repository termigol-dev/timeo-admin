import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees } from './api';
import { useAuth } from './auth/AuthContext';

export default function EmployeesList() {

  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const e = await getAllEmployees();
      console.log('📦 EMPLOYEES RAW:', e);
      setEmployees(e || []);
    } finally {
      setLoading(false);
    }
  }

  const visibleEmployees = isSuperAdmin
    ? employees
    : employees.filter(e => e.active);

  const filtered = visibleEmployees.filter(e =>
    `${e.name} ${e.firstSurname || ''} ${e.dni || ''} ${e.email || ''}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  if (loading) {
    return <div className="center">Cargando empleados…</div>;
  }

  return (
    <div className="container employees-container">

      <div className="page-header">
        <h2>Empleados</h2>

        <div className="tablet-actions">
          <button onClick={() => navigate(-1)}>← Volver</button>
        </div>
      </div>

      <input
        className="search"
        placeholder="Buscar empleado…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <div className="employees-grid">

        {filtered.map(e => {

          const initials =
            `${e.name?.[0] || ''}${e.firstSurname?.[0] || ''}`.toUpperCase();

          const isIn = e.isIn ?? false;

          return (
            <div
              key={e.id}
              className="employee-card"
              onClick={() => navigate(`/admin/users/${e.id}/profile`)}
            >

              {/* FOTO */}
              <div className="employee-avatar">
                {e.photoUrl ? (
                  <img src={e.photoUrl} alt="" />
                ) : (
                  initials
                )}
              </div>

              {/* CONTENIDO */}
              <div className="employee-main">

                <div className="employee-line">

                  <span className="employee-name">
                    {e.name} {e.firstSurname || ''}
                  </span>

                  {e.dni && (
                    <span className="employee-dni">
                      {e.dni}
                    </span>
                  )}

                  <span className={`employee-status ${e.active ? 'active' : 'inactive'}`}>
                    {e.active ? 'Activo' : 'Inactivo'}
                  </span>

                </div>
              </div>

              {/* IN / OUT */}
              <div className={`employee-check ${isIn ? 'in' : 'out'}`}>
                {isIn ? 'IN' : 'OUT'}
              </div>

            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="center muted">
            No hay empleados registrados
          </div>
        )}

      </div>
    </div>
  );
}