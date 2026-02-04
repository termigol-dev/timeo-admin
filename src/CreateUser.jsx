import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createEmployee, getBranches } from './api';

export default function CreateUser({ onCreated, defaultRole = 'EMPLEADO' }) {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const rawUser = localStorage.getItem('user');
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  const [branches, setBranches] = useState([]);

  const [form, setForm] = useState({
    name: '',
    firstSurname: '',
    secondSurname: '',
    dni: '',
    email: '',
    role: defaultRole,
    branchId: '',
  });

  const [password, setPassword] = useState('');

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  /* ───────── CARGA SUCURSALES ───────── */
  useEffect(() => {
    if (companyId) {
      getBranches(companyId).then(setBranches);
    }
  }, [companyId]);

  /* ───────── ROLES PERMITIDOS ───────── */
  const allowedRoles = useMemo(() => {
    if (!currentUser) return [];

    switch (currentUser.role) {
      case 'SUPERADMIN':
        return ['ADMIN_EMPRESA', 'ADMIN_SUCURSAL', 'EMPLEADO'];
      case 'ADMIN_EMPRESA':
        return ['ADMIN_EMPRESA', 'ADMIN_SUCURSAL', 'EMPLEADO'];
      case 'ADMIN_SUCURSAL':
        return ['EMPLEADO'];
      default:
        return [];
    }
  }, [currentUser]);

  const needsBranch =
    form.role === 'EMPLEADO' || form.role === 'ADMIN_SUCURSAL';

  function change(e) {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'role' && value === 'ADMIN_EMPRESA'
        ? { branchId: '' }
        : {}),
    }));
  }

  function onSelectPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const payload = {
        ...form,
        password,
      };

      if (!payload.branchId) delete payload.branchId;

      const created = await createEmployee(companyId, payload);

      if (photoFile && created?.id) {
        const fd = new FormData();
        fd.append('file', photoFile);

        await fetch(
          `${import.meta.env.VITE_API_URL}/users/${created.id}/photo`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: fd,
          },
        );
      }

      setMessage('Usuario creado correctamente');

      setForm({
        name: '',
        firstSurname: '',
        secondSurname: '',
        dni: '',
        email: '',
        role: defaultRole,
        branchId: '',
      });

      setPassword('');
      setPhotoFile(null);
      setPhotoPreview(null);

      onCreated?.();
    } catch (err) {
      setError(err.message || 'Error creando usuario');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="container"
      style={{ maxWidth: 720, margin: '0 auto' }}
    >
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h2>Nuevo usuario</h2>

        <div className="tablet-actions">
          <button type="button" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={submit}>
          {/* FOTO */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                color: '#475569',
                flexShrink: 0,
              }}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span style={{ fontSize: 12 }}>Sin foto</span>
              )}
            </div>

            <label
              style={{
                cursor: 'pointer',
                fontWeight: 600,
                color: 'rgb(0,160,168)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              ➕ Añadir foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={onSelectPhoto}
              />
            </label>
          </div>

          {/* DATOS PERSONALES */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <div>
              <label className="text-sm block mb-1">Nombre</label>
              <input
                className="w-full"
                name="name"
                value={form.name}
                onChange={change}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">
                Primer apellido
              </label>
              <input
                className="w-full"
                name="firstSurname"
                value={form.firstSurname}
                onChange={change}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">
                Segundo apellido
              </label>
              <input
                className="w-full"
                name="secondSurname"
                value={form.secondSurname}
                onChange={change}
              />
            </div>

            <div>
              <label className="text-sm block mb-1">DNI</label>
              <input
                className="w-full"
                name="dni"
                value={form.dni}
                onChange={change}
                required
              />
            </div>
          </div>

          {/* EMAIL */}
          <div style={{ marginTop: 16 }}>
            <label className="text-sm block mb-1">Email</label>
            <input
              className="w-full"
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              required
            />
          </div>

          {/* PASSWORD */}
          <div style={{ marginTop: 16 }}>
            <label className="text-sm block mb-1">
              Contraseña inicial
            </label>
            <input
              className="w-full"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {/* ROL + SUCURSAL */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginTop: 16,
            }}
          >
            <div>
              <label className="text-sm block mb-1">Rol</label>
              <select
                className="w-full"
                name="role"
                value={form.role}
                onChange={change}
              >
                {allowedRoles.map(r => (
                  <option key={r} value={r}>
                    {r === 'EMPLEADO' && 'Empleado'}
                    {r === 'ADMIN_SUCURSAL' &&
                      'Administrador de sucursal'}
                    {r === 'ADMIN_EMPRESA' &&
                      'Administrador de empresa'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">
                Sucursal
              </label>
              <select
                className="w-full"
                name="branchId"
                value={form.branchId}
                onChange={change}
                disabled={!needsBranch}
                required={needsBranch}
              >
                <option value="">
                  {needsBranch
                    ? 'Selecciona sucursal'
                    : 'No aplica'}
                </option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ACCIONES */}
          <div
            className="tablet-actions"
            style={{ marginTop: 28 }}
          >
            <button type="submit" disabled={saving}>
              Crear usuario
            </button>
          </div>

          {message && (
            <div
              style={{
                marginTop: 16,
                color: '#059669',
                fontWeight: 600,
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: 16,
                color: '#ef4444',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}