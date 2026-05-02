import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  getEmployees,
  deleteEmployee,
  hardDeleteEmployee,
  getBranches,
} from './api';
import { useAuth } from './auth/AuthContext';
import { FileText, Calendar, Trash2 } from 'lucide-react';

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

          <button onClick={() =>
            navigate(`/admin/companies/${companyId}/employees/new`)
          }>
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

      <div className="employees-grid">

        {filtered.map(e => {

          const initials =
            `${e.name?.[0] || ''}${e.firstSurname?.[0] || ''}`.toUpperCase();

          const isIn = e.isIn ?? false;

          return (
            <div key={e.id} className="employee-card">

              {/* ZONA CLICK PERFIL */}
              <div
                style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }}
                onClick={() => navigate(`/admin/users/${e.id}/profile`)}
              >

                {/* AVATAR */}
                <div className="employee-avatar">
                  {e.photoUrl ? (
                    <img src={e.photoUrl} alt="" />
                  ) : (
                    initials
                  )}
                </div>

                {/* INFO */}
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

                  {/* SUCURSAL */}
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {e.branch?.name || 'Sin sucursal'}
                  </div>

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