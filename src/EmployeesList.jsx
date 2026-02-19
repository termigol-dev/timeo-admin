import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees, deleteEmployee, hardDeleteEmployee } from './api';
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
      setEmployees(e || []);
    } finally {
      setLoading(false);
    }
  }

  /* 🟡 SOFT DELETE */
  async function remove(employee) {
    if (!employee.companyId) return;

    const ok = window.confirm(`Eliminar empleado ${employee.name}?`);
    if (!ok) return;

    await deleteEmployee(employee.companyId, employee.id);
    load();
  }

  /* 🔴 HARD DELETE */
  async function hardDelete(employee) {
    const first = window.confirm(
      `⚠️ BORRADO TOTAL (PRUEBAS)\n\nVas a eliminar DEFINITIVAMENTE a:\n${employee.name} ${employee.firstSurname || ''}`
    );
    if (!first) return;

    const second = window.confirm(
      `🚨 CONFIRMACIÓN FINAL\n\nEsto eliminará TODOS los datos del empleado.`
    );
    if (!second) return;

    try {
      await hardDeleteEmployee(employee.companyId, employee.id);
      await load();
      alert('Empleado eliminado definitivamente');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error en el borrado definitivo');
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

      <table className="table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Empleado</th>
            <th>DNI</th>
            <th>Sucursal</th>
            <th>Activo</th>
            <th className="right">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map(e => {

            const initials =
              `${e.name?.[0] || ''}${e.firstSurname?.[0] || ''}`.toUpperCase();

            return (
              <tr key={e.id} style={{ opacity: isSuperAdmin && !e.active ? 0.5 : 1 }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#475569',
                        flexShrink: 0,
                      }}
                    >
                      {e.photoUrl ? (
                        <img src={e.photoUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        initials
                      )}
                    </div>

                    <span
                      className="clickable-name"
                      onClick={() => navigate(`/admin/users/${e.id}/profile`)}
                    >
                      {e.name} {e.firstSurname || ''}
                    </span>
                  </div>
                </td>

                <td>{e.dni}</td>
                <td>{e.branch?.name || '—'}</td>
                <td>{e.active ? 'Sí' : 'No'}</td>

                <td className="right">
                  <div className="tablet-actions">

                    <button onClick={() => navigate(`/admin/employees/${e.id}/reports`)}>
                      Informes
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/admin/companies/${e.companyId}/employees/${e.id}/schedules`)
                      }
                    >
                      Horarios
                    </button>

                    <button
                      onClick={() => remove(e)}
                      style={{ backgroundColor: '#ef4444' }}
                    >
                      Eliminar
                    </button>

                    {isSuperAdmin && (
                      <button
                        onClick={() => hardDelete(e)}
                        title="Borrado total (solo pruebas)"
                        style={{ backgroundColor: '#991b1b', color: 'white', fontWeight: 900 }}
                      >
                        ✕
                      </button>
                    )}

                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}