import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, updateUser } from './api';
export default function Profile() {

  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userId) {
      load();
    }
    // eslint-disable-next-line
  }, [userId]);

  async function load() {
    setLoading(true);
    try {
      const u = await getUserById(userId);   // 👈 AQUÍ
      setUser(u);
      setForm({
        name: u.name || '',
        firstSurname: u.firstSurname || '',
        secondSurname: u.secondSurname || '',
        dni: u.dni || '',
        email: u.email || '',
      });

      setPhotoPreview(u.photo || null);
    } finally {
      setLoading(false);
    }
  }

  function change(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function onSelectPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const base64 = await resizeImageToBase64(file, 512, 0.8);

    setPhotoFile(base64);
    setPhotoPreview(base64);
  }

  function resizeImageToBase64(file, maxSize = 512, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = e => {
        img.onload = () => {
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = height * (maxSize / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = width * (maxSize / height);
              height = maxSize;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };

        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function saveProfile() {
    setSaving(true);
    setMessage('');

    try {
      console.log('➡️ updateUser()', userId, form);
      await updateUser(userId, form);

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
              photo: photoFile,   // 👈 ya es base64 reducido
            }),
          }
        );

        if (!res.ok) {
          throw new Error('Error subiendo foto');
        }
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

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  }

  if (loading) {
    return <div className="center">Cargando perfil…</div>;
  }

  if (!user || !form) {
    return <div className="center">Usuario no encontrado</div>;
  }

  const initials =
    `${user.name?.[0] || ''}${user.firstSurname?.[0] || ''}`.toUpperCase();

  return (
    <div className="container" style={{ maxWidth: 720, margin: '0 auto' }}>

      <div className="page-header" style={{ marginBottom: 24 }}>
        <h2>Perfil de empleado</h2>

        <div className="tablet-actions">
          <button onClick={() => navigate(-1)}>← Volver</button>
        </div>
      </div>

      <div className="card">

        {/* FOTO */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
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
              initials
            )}
          </div>

          <label className="cursor-pointer text-sm font-medium text-emerald-600">
            Añadir foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onSelectPhoto}
            />
          </label>
        </div>

        {/* DATOS */}

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="text-sm block mb-1">Nombre</label>
            <input
              className="w-full"
              name="name"
              value={form.name}
              onChange={change}
            />
          </div>

          <div>
            <label className="text-sm block mb-1">Primer apellido</label>
            <input
              className="w-full"
              name="firstSurname"
              value={form.firstSurname}
              onChange={change}
            />
          </div>

          <div>
            <label className="text-sm block mb-1">Segundo apellido</label>
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
            />
          </div>

        </div>

        <div className="mt-4">
          <label className="text-sm block mb-1">Email</label>
          <input
            className="w-full"
            name="email"
            value={form.email}
            onChange={change}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <button
            className="primary"
            disabled={saving}
            onClick={saveProfile}
          >
            Guardar cambios
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(`/admin/employees/${userId}/reports`)
            }
          >
            📊 Informes
          </button>
        </div>


        {message && (
          <p className="center" style={{ marginTop: 12 }}>
            {message}
          </p>
        )}

      </div>
    </div>
  );
}