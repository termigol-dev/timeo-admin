import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  getEmployees,
  deleteEmployee,
  hardDeleteEmployee,
  getBranches,
} from './api';
import { useAuth } from './auth/AuthContext';

export default function Employees() {

  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  console.log('🧠 AUTH USER:', user);
  console.log('🧠 ROLE:', user?.role);

  const isAdminEmpresa = user?.role === 'ADMIN_EMPRESA';
  const isAdminSucursal = user?.role === 'ADMIN_SUCURSAL';
  const isLimitedView = isAdminEmpresa || isAdminSucursal;
  console.log('🧠 ROLE FLAGS:', {
    isAdminEmpresa,
    isAdminSucursal,
    isLimitedView,
    isSuperAdmin
  });

  const navigate = useNavigate();
  const { companyId } = useParams();
  const [searchParams] = useSearchParams();
  const branchFilter = searchParams.get('branch');

  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (companyId) load();
  }, [companyId]);

  async function load() {
    setLoading(true);
    try {
      const [e, b] = await Promise.all([
        getEmployees(companyId),
        getBranches(companyId),
      ]);
      setEmployees(e || []);
      setBranches(b || []);
    } finally {
      setLoading(false);
    }
  }

  async function remove(employee) {
    const ok = window.confirm(`Eliminar a ${employee.name}?`);
    if (!ok) return;

    await deleteEmployee(employee.companyId ?? companyId, employee.id);
    load();
  }

  async function hardDelete(employee) {
    const ok = window.confirm('Borrado definitivo');
    if (!ok) return;

    await hardDeleteEmployee(employee.companyId ?? companyId, employee.id);
    load();
  }

  /* ───────── FILTER + SORT ───────── */

  const visibleEmployees = isSuperAdmin
    ? employees
    : employees.filter(e => e.active);

  const visible = branchFilter
    ? visibleEmployees.filter(e => e.branchId === branchFilter)
    : visibleEmployees;

  const filtered = visible
    .filter(e =>
      `${e.name} ${e.firstSurname || ''} ${e.secondSurname || ''}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
    .sort((a, b) =>
      (a.firstSurname || '').localeCompare(b.firstSurname || '')
    );

  function formatName(e) {
    return `${e.firstSurname || ''} ${e.secondSurname || ''}, ${e.name}`;
  }

  if (authLoading) return <div className="center">Cargando…</div>;
  if (loading) return <div className="center">Cargando empleados…</div>;

  return (
    <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>

      <div className="page-header" style={{ marginBottom: 24 }}>
        <h2>Empleados</h2>

        <div className="tablet-actions">
          <button onClick={() => navigate(-1)}>← Volver</button>

          {!isLimitedView && (
            <button onClick={() =>
              navigate(`/admin/companies/${companyId}/employees/new`)
            }>
              + Nuevo empleado
            </button>
          )}
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
            {!isLimitedView && <th className="right">Acciones</th>}
          </tr>
        </thead>

        <tbody>
          {filtered.map(e => {

            const initials =
              `${e.name?.[0] || ''}${e.firstSurname?.[0] || ''}`.toUpperCase();

            console.log('🎨 RENDER EMPLOYEE ROW:', {
              id: e.id,
              isLimitedView
            });
            return (
              <tr key={e.id} style={{ opacity: isSuperAdmin && !e.active ? 0.5 : 1 }}>

                {/* ───── EMPLEADO ───── */}
                <td
                  onClick={() => navigate(`/admin/users/${e.id}/profile`)}
                  style={{ cursor: 'pointer', fontWeight: 500 }}
                >

                  {isLimitedView ? (
                    // 👇 ADMIN: SOLO TEXTO
                    formatName(e)
                  ) : (
                    // 👇 SUPERADMIN: FOTO + NOMBRE
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
                        }}
                      >
                        {e.photoUrl ? (
                          <img src={e.photoUrl} alt="" style={{ width: '100%', height: '100%' }} />
                        ) : (
                          initials
                        )}
                      </div>

                      <span>{formatName(e)}</span>
                    </div>
                  )}

                </td>

                <td>{e.dni}</td>
                <td>{e.branch?.name || '—'}</td>
                <td>{e.active ? 'Sí' : 'No'}</td>

                {/* ───── ACCIONES ───── */}
                {!isLimitedView && (
                  <td className="right">
                    <div className="tablet-actions">

                      <button onClick={() => navigate(`/admin/employees/${e.id}/reports`)}>
                        Informes
                      </button>

                      <button onClick={() =>
                        navigate(`/admin/companies/${companyId}/employees/${e.id}/schedules`)
                      }>
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
                          style={{ backgroundColor: '#991b1b', color: 'white' }}
                        >
                          ✕
                        </button>
                      )}

                    </div>
                  </td>
                )}

              </tr>
            );
          })}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={isLimitedView ? 4 : 5} className="center muted">
                No hay empleados registrados
              </td>
            </tr>
          )}

        </tbody>
      </table>
    </div>
  );
}