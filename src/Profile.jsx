import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUserById,
  updateUser,
  getCompanies,
  getBranches,
} from './api';

export default function Profile() {

  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [devices, setDevices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  async function load() {
    setLoading(true);
    try {
      const u = await getUserById(userId);
      const allCompanies = await getCompanies();

      setUser(u);
      setCompanies(allCompanies || []);

      setSelectedCompany(u.companyId || '');
      setSelectedBranch(u.branchId || '');

      if (u.companyId) {
        const b = await getBranches(u.companyId);
        setBranches(b || []);
      }

      setForm({
        name: u.name || '',
        firstSurname: u.firstSurname || '',
        secondSurname: u.secondSurname || '',
        dni: u.dni || '',
        email: u.email || '',
      });

      setPhotoPreview(u.photoUrl || null);

      // CARGAR DEVICES (solo superadmin)
      if (currentUser?.role === 'SUPERADMIN') {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/devices/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (res.ok) {
          const d = await res.json();
          setDevices(d || []);
        }
      }

    } finally {
      setLoading(false);
    }
  }

  function change(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function changeCompany(companyId) {
    setSelectedCompany(companyId);
    setSelectedBranch('');

    const b = await getBranches(companyId);
    setBranches(b || []);
  }

  function changeBranch(branchId) {
    setSelectedBranch(branchId);
  }

  async function saveProfile() {
    setSaving(true);
    setMessage('');

    try {
      await updateUser(userId, {
        ...form,
        companyId: selectedCompany,
        branchId: selectedBranch,
      });

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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
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
          padding: 40,
          border: '1px solid #e2e8f0',
        }}
      >

        {/* FOTO + EMPRESA */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 28,
          }}
        >

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>

            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 22,
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
              <label style={labelStyle}>Foto del empleado</label>

              <div style={{ marginTop: 8 }}>
                <label style={photoButtonStyle}>
                  Cambiar foto
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

        {/* GRID CAMPOS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 28,
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
        </div>

        {/* DEVICES SOLO SUPERADMIN */}
        {currentUser?.role === 'SUPERADMIN' && (
          <div style={{ marginTop: 40 }}>
            <h3 style={{ marginBottom: 12 }}>Devices</h3>

            {devices.length === 0 && (
              <div style={{ fontSize: 14, opacity: 0.7 }}>
                No hay dispositivos registrados
              </div>
            )}

            {devices.map(d => (
              <div
                key={d.id}
                style={{
                  padding: 10,
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  marginBottom: 10,
                  fontSize: 13,
                  background: '#fff',
                }}
              >
                <div><strong>{d.platform}</strong></div>
                <div style={{ wordBreak: 'break-all' }}>{d.token}</div>
              </div>
            ))}
          </div>
        )}

        <div className="tablet-actions" style={{ marginTop: 40 }}>
          <button onClick={saveProfile} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>

          <button
            onClick={() =>
              navigate(`/admin/employees/${userId}/reports`)
            }
          >
            📊 Informes
          </button>
        </div>

        {message && (
          <p style={{ marginTop: 20, fontSize: 14, opacity: 0.7 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
};

const inputStyle = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  background: '#ffffff',
};

const selectStyle = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  background: '#ffffff',
  cursor: 'pointer',
};

const photoButtonStyle = {
  padding: '8px 14px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  fontSize: 13,
  cursor: 'pointer',
};