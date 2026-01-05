import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createBranch } from './api';

export default function NewBranch() {
  const navigate = useNavigate();
  const { companyId } = useParams();

  const [form, setForm] = useState({
    name: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ───────── HANDLERS ───────── */

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('El nombre de la sucursal es obligatorio');
      return;
    }

    try {
      setLoading(true);

      // ✅ companyId va en la URL, NO en el body
      await createBranch(companyId, {
        name: form.name,
        address: form.address || undefined,
      });

      navigate(`/admin/companies/${companyId}/branches`);
    } catch (err) {
      setError(err.message || 'Error al crear la sucursal');
    } finally {
      setLoading(false);
    }
  }

  /* ───────── RENDER ───────── */

  return (
    <div className="container" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h2>Nueva sucursal</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Nombre *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label>Dirección</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
          />
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
            {loading ? 'Creando…' : 'Crear sucursal'}
          </button>
        </div>
      </form>
    </div>
  );
}