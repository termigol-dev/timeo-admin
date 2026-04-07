import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUserById,
  updateUser,
  getBranches,
  deleteEmployee,
} from './api';

export default function Profile() {

  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);

  const [branches, setBranches] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState('');

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [devices, setDevices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user'));

  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';
  const isCompanyAdmin = currentUser?.role === 'ADMIN_EMPRESA';
  const isBranchAdmin = currentUser?.role === 'ADMIN_SUCURSAL';

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  async function load() {
    setLoading(true);
    try {
      const u = await getUserById(userId);

      setUser(u);

      setSelectedBranch(u.branchId || '');

      // 🔥 SOLO si tiene sentido cargar sucursales
      if (u.companyId && (isSuperAdmin || isCompanyAdmin)) {
        const b = await getBranches(u.companyId);
        setBranches(b || []);
      }

      setForm({
        name: u.name || '',
        firstSurname: u.firstSurname || '',
        secondSurname: u.secondSurname || '',
        dni: u.dni || '',
        email: u.email || '',
        password: '', // 🔥 NUEVO
      });
      setPhotoPreview(u.photoUrl || null);


    } finally {
      setLoading(false);
    }
  }

  function change(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function changeBranch(branchId) {
    setSelectedBranch(branchId);
  }

  async function saveProfile() {
    setSaving(true);
    setMessage('');

    try {
      const payload = {
        ...form,
        branchId: selectedBranch,
      };

      // 🔥 eliminar password si está vacío
      if (!payload.password) {
        delete payload.password;
      }

      await updateUser(userId, payload);

      if (photoFile) {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/users/${userId}/photo`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              photoUrl: photoFile,
            }),
          }
        );

        if (!res.ok) throw new Error('Error subiendo foto');
      }

      setMessage('Perfil actualizado correctamente');
      await load();
      setPhotoFile(null);

    } catch (e) {
      console.error(e);
      setMessage('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  }

  function onSelectPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setPhotoFile(reader.result);
    };
    reader.readAsDataURL(file);
  }

  if (loading) return <div className="center">Cargando perfil…</div>;
  if (!user || !form) return <div className="center">Usuario no encontrado</div>;

  const initials =
    `${user.name?.[0] || ''}${user.firstSurname?.[0] || ''}`.toUpperCase();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0 }}>Perfil de empleado</h2>

        <div className="tablet-actions">
          <button onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>

      <div
        style={{
          background: '#f8fafc',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #e2e8f0',
        }}
      >

        {/* FOTO + EMPRESA */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16
          }}
        >

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 20,
                color: '#475569',
              }}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>

            <div>
              <div style={{ fontWeight: 600 }}>
                {user.name} {user.firstSurname}
              </div>

              <div style={{ fontSize: 13, opacity: 0.7 }}>
                {user.companyName}
              </div>

              <label style={labelStyle}>Foto</label>
              <div style={{ marginTop: 6 }}>
                <label style={photoButtonStyle}>
                  Cambiar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSelectPhoto}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}
        >

          <Field label="Nombre">
            <input name="name" value={form.name} onChange={change} style={inputStyle} />
          </Field>

          <Field label="Primer apellido">
            <input name="firstSurname" value={form.firstSurname} onChange={change} style={inputStyle} />
          </Field>

          <Field label="Segundo apellido">
            <input name="secondSurname" value={form.secondSurname} onChange={change} style={inputStyle} />
          </Field>

          <Field label="DNI">
            <input name="dni" value={form.dni} onChange={change} style={inputStyle} />
          </Field>

          <Field label="Email">
            <input name="email" value={form.email} onChange={change} style={inputStyle} />
          </Field>

          <Field label="Contraseña">
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={change}
              placeholder="Nueva contraseña"
              style={inputStyle}
            />
          </Field>

          {/* 🔥 SOLO ADMIN EMPRESA */}
          {(isSuperAdmin || isCompanyAdmin) && (
            <Field label="Sucursal">
              <select
                value={selectedBranch}
                onChange={e => changeBranch(e.target.value)}
                style={selectStyle}
              >
                <option value="">— Sin sucursal —</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

        </div>

        {/* ACTIONS */}
        <div className="tablet-actions" style={{ marginTop: 32 }}>
          <button onClick={saveProfile} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>

          <button
            onClick={() =>
              navigate(`/admin/employees/${userId}/reports`)
            }
          >
            Informes
          </button>

          <button
            onClick={() =>
              navigate(`/admin/employees/${userId}/schedules`)
            }
          >
            Horarios
          </button>

          <button
            onClick={async () => {

              const first = window.confirm(
                `⚠️ Eliminar empleado\n\n¿Seguro que quieres eliminar a:\n${user.name} ${user.firstSurname || ''}?`
              );
              if (!first) return;

              const second = window.confirm(
                `🚨 Confirmación final\n\nEl empleado será eliminado.`
              );
              if (!second) return;

              try {

                // 🔑 fallback por si user.companyId viene vacío
                const currentUser = JSON.parse(localStorage.getItem('user'));

                const companyIdToUse = user.companyId || currentUser?.companyId;

                if (!companyIdToUse) {
                  alert('Error: no se pudo determinar la empresa');
                  return;
                }

                await deleteEmployee(companyIdToUse, userId);

                alert('Empleado eliminado');

                navigate(-1);

              } catch (err) {
                console.error(err);
                alert(err.message || 'Error eliminando empleado');
              }

            }}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
            }}
          >
            Eliminar
          </button>

        </div>
        {message && (
          <p style={{ marginTop: 12, fontSize: 13 }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

/* COMPONENTE FIELD */
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
};

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
};

const selectStyle = inputStyle;

const photoButtonStyle = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 12,
  cursor: 'pointer',
};