import React, { useEffect, useState } from 'react';
import {
  getMyProfile,
  updateMyPassword,
  updateMyPhoto,
} from './api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const me = await getMyProfile();
      setUser(me);
      setPhotoUrl(me.photoUrl || '');
    } finally {
      setLoading(false);
    }
  }

  async function savePassword() {
    if (!password) return;
    setSaving(true);
    try {
      await updateMyPassword(password);
      setPassword('');
      setMessage('Contraseña actualizada correctamente');
    } catch {
      setMessage('Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  }

  async function savePhoto() {
    setSaving(true);
    try {
      await updateMyPhoto(photoUrl);
      setMessage('Foto actualizada correctamente');
    } catch {
      setMessage('Error al actualizar la foto');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="center">Cargando perfil…</div>;
  }

  return (
    <div className="container">
      <h2>Mi perfil</h2>

      <div className="card">
        <p>
          <strong>Nombre:</strong> {user.name} {user.firstSurname}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Rol:</strong> {user.role}
        </p>

        <hr />

        {/* FOTO */}
        <h4>Foto de perfil</h4>
        <input
          placeholder="URL de la foto"
          value={photoUrl}
          onChange={e => setPhotoUrl(e.target.value)}
        />
        <button
          className="primary"
          onClick={savePhoto}
          disabled={saving}
        >
          Guardar foto
        </button>

        <hr />

        {/* PASSWORD */}
        <h4>Cambiar contraseña</h4>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          className="primary"
          onClick={savePassword}
          disabled={saving || !password}
        >
          Cambiar contraseña
        </button>

        {message && <p className="center">{message}</p>}
      </div>
    </div>
  );
}