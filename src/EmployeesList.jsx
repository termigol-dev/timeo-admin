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
    <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>

      <div className="page-header" style={{ marginBottom: 24 }}>
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
        style={{ marginBottom: 24 }}
      />

      <div style={{ display: 'grid', gap: 12 }}>

        {filtered.map(e => {

          const initials =
            `${e.name?.[0] || ''}${e.firstSurname?.[0] || ''}`.toUpperCase();

          // 🔥 MOCK estado IN/OUT (luego lo conectas a records reales)
          const isIn = e.isIn ?? false;

          return (
            <div
              key={e.id}
              onClick={() => navigate(`/admin/users/${e.id}/profile`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px 18px',
                borderRadius: 18,
                background: 'var(--card-bg)',
                border: '1px solid var(--border-soft)',
                cursor: 'pointer',
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >

              {/* FOTO */}
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {e.photoUrl ? (
                  <img
                    src={e.photoUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  initials
                )}
              </div>

              {/* IZQUIERDA: ESTADO + NOMBRE + DNI */}
              <div style={{ flex: 1 }}>

                {/* Estado activo */}
                <span
                  style={{
                    display: 'inline-block',
                    marginBottom: 6,
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: e.active ? '#dcfce7' : '#fee2e2',
                    color: e.active ? '#166534' : '#991b1b',
                  }}
                >
                  {e.active ? 'Activo' : 'Inactivo'}
                </span>

                {/* Nombre + DNI */}
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  {e.name} {e.firstSurname || ''}
                </div>

                {e.dni && (
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                    {e.dni}
                  </div>
                )}

              </div>

              {/* DERECHA: BOTÓN IN/OUT */}
              <div>

                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'white',
                    background: isIn ? '#16a34a' : '#dc2626', // verde / rojo
                    minWidth: 70,
                    textAlign: 'center',
                  }}
                >
                  {isIn ? 'IN' : 'OUT'}
                </div>

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