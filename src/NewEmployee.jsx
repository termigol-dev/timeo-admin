import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEmployee, getBranches } from './api';

/* 🛠 CONFIGURACIÓN */
const SUPERADMIN_EMAIL =
  import.meta.env.VITE_SUPERADMIN_EMAIL || 'termigol82@gmail.com';

const ROLES = [
  { value: 'EMPLEADO', label: 'Empleado' },
  { value: 'ADMIN_SUCURSAL', label: 'Admin sucursal' },
  { value: 'ADMIN_EMPRESA', label: 'Admin empresa' },
];

export default function NewEmployee() {
  const navigate = useNavigate();
  const { companyId } = useParams();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🆕 para reactivación
  const [reactivateUserId, setReactivateUserId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    firstSurname: '',
    secondSurname: '',
    dni: '',
    email: '',
    role: 'EMPLEADO',
    branchId: '',
  });

  /* ───────── LOAD BRANCHES ───────── */
  useEffect(() => {
    loadBranches();
    // eslint-disable-next-line
  }, [companyId]);

  async function loadBranches() {
    const data = await getBranches(companyId);
    setBranches(data || []);
  }

  /* ───────── HANDLERS ───────── */
  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function submit(payload) {
    await createEmployee(companyId, payload);
    navigate(`/admin/companies/${companyId}/employees`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (
      !form.name ||
      !form.firstSurname ||
      !form.email ||
      !form.branchId
    ) {
      setError(
        'Nombre, apellido, email y sucursal son obligatorios',
      );
      return;
    }

    const payload = {
      name: form.name,
      firstSurname: form.firstSurname,
      secondSurname: form.secondSurname,
      dni: form.dni,
      email: form.email,
      role: form.role,
      branchId: form.branchId,
      reactivateUserId,
    };

    try {
      setLoading(true);
      await submit(payload);
    } catch (err) {
      const data = err?.response?.data;

      if (data?.code === 'DNI_INACTIVE') {
        const ok = window.confirm(
          'Este DNI ya existe y el usuario está inactivo.\n\n¿Quieres reactivarlo?',
        );

        if (ok) {
          try {
            await submit({
              ...payload,
              reactivateUserId: data.userId,
            });
          } catch (e) {
            setError(
              e?.response?.data?.message ||
                'Error al reactivar el usuario',
            );
          }
        }
        return;
      }

      if (data?.code === 'DNI_ACTIVE') {
        setError(
          `Este DNI ya pertenece a un usuario activo.\nContacta con el Super Admin (${SUPERADMIN_EMAIL}).`,
        );
        return;
      }

      setError(
        data?.message || 'Error al crear el empleado',
      );
    } finally {
      setLoading(false);
    }
  }

  /* ───────── RENDER ───────── */
  return (
    <div className="container" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h2>Nuevo empleado</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Nombre *</label>
          <input name="name" value={form.name} onChange={handleChange} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Primer apellido *</label>
          <input
            name="firstSurname"
            value={form.firstSurname}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Segundo apellido</label>
          <input
            name="secondSurname"
            value={form.secondSurname}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>DNI</label>
          <input name="dni" value={form.dni} onChange={handleChange} />
        </div>

        <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
          El DNI y el mail no podrán modificarse más adelante si el empleado tiene registros.
          <br />
          Para cambios posteriores será necesario contactar con el Super Admin (
          <strong>{SUPERADMIN_EMAIL}</strong>).
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Email *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
          El email no podrá modificarse más adelante si el empleado tiene registros.
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Sucursal *</label>
          <select
            name="branchId"
            value={form.branchId}
            onChange={handleChange}
          >
            <option value="">— Selecciona sucursal —</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label>Rol</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="tablet-actions">
          <button type="button" onClick={() => navigate(-1)}>
            Cancelar
          </button>

          <button type="submit" disabled={loading}>
            {loading ? 'Creando…' : 'Crear empleado'}
          </button>
        </div>
      </form>
    </div>
  );
}