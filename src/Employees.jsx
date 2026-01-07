import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  getEmployees,
  deleteEmployee,
  getBranches,
  toggleEmployee,
  updateUserBranch,
} from './api';

export default function Employees() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [searchParams] = useSearchParams();
  const branchFilter = searchParams.get('branch');

  // 🔑 Rol del usuario autenticado
  const role = localStorage.getItem('role');

  const isSuperAdmin = role === 'SUPERADMIN';
  const isAdminEmpresa = role === 'ADMIN_EMPRESA';
  const isAdminSucursal = role === 'ADMIN_SUCURSAL';

  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  /* ───────── LOAD ───────── */
  useEffect(() => {
    if (companyId) load();
    // eslint-disable-next-line
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

  /* ───────── ACTIVAR / DESACTIVAR (SOLO SUPERADMIN) ───────── */
  async function toggle(employee) {
    if (!isSuperAdmin) return;
    await toggleEmployee(companyId, employee.id);
    load();
  }

  /* ───────── CAMBIAR SUCURSAL ───────── */
  async function changeBranch(employeeId, branchId) {
    await updateUserBranch(
      companyId,
      employeeId,
      branchId || null,
    );
    load();
  }

  /* ───────── ELIMINAR (DOBLE CONFIRMACIÓN) ───────── */
  async function remove(employee) {
    const first = window.confirm(
      `⚠️ Eliminar empleado\n\n¿Estás seguro de que quieres eliminar a:\n${employee.name} ${employee.firstSurname || ''}?`
    );
    if (!first) return;

    const second = window.confirm(
      `🚨 Confirmación final\n\nEl empleado va a ser eliminado.\n\nPulsa en "Sí" para confirmar la acción.`
    );
    if (!second) return;

    try {
      await deleteEmployee(companyId, employee.id);
      load();
      alert('Empleado eliminado');
    } catch (err) {
      alert(
        err.message ||
          'No se puede eliminar este empleado. Puede tener historial o pertenecer a otra empresa.',
      );
    }
  }

  /* ───────── FILTERS ───────── */

  const visibleEmployees =
    isSuperAdmin
      ? employees
      : employees.filter(e => e.active);

  const visible = branchFilter
    ? visibleEmployees.filter(e => e.branchId === branchFilter)
    : visibleEmployees;

  const filtered = visible.filter(e =>
    `${e.name} ${e.firstSurname || ''} ${e.dni || ''}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  /* ───────── RENDER ───────── */
  if (loading) {
    return <div className="center">Cargando empleados…</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h2>Empleados</h2>

        <div className="tablet-actions">
          <button onClick={() => navigate(-1)}>← Volver</button>
          <button
            onClick={() =>
              navigate(`/admin/companies/${companyId}/employees/new`)
            }
          >
            + Nuevo empleado
          </button>
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
          {filtered.map(e => (
            <tr
              key={e.id}
              style={{
                opacity: isSuperAdmin && !e.active ? 0.5 : 1,
              }}
            >
              <td>
                <strong>
                  {e.name} {e.firstSurname || ''}
                </strong>
              </td>

              <td>{e.dni}</td>

              <td>
                <select
                  value={e.branchId || ''}
                  onChange={ev =>
                    changeBranch(e.id, ev.target.value)
                  }
                >
                  <option value="">— Sin sucursal —</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </td>

              <td>{e.active ? 'Sí' : 'No'}</td>

              <td className="right">
                <div className="tablet-actions">
                  <button
                    onClick={() =>
                      navigate(
                        `/admin/companies/${companyId}/employees/${e.id}/edit`,
                      )
                    }
                  >
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      navigate(
                        `/admin/companies/${companyId}/employees/${e.id}/photo`,
                      )
                    }
                  >
                    Foto
                  </button>

                  <button
                    onClick={() =>
                      navigate(
                        `/admin/companies/${companyId}/employees/${e.id}/schedules`,
                      )
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
                </div>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan="5" className="center muted">
                No hay empleados registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}