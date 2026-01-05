import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompany } from './api';

export default function NewCompany() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    legalName: '',
    commercialName: '',
    nif: '',
    address: '',
    plan: 'BASIC',
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

    if (!form.legalName || !form.nif || !form.address) {
      setError('La razón social, el NIF y la dirección son obligatorios');
      return;
    }

    try {
      setLoading(true);

      await createCompany({
        legalName: form.legalName,
        commercialName: form.commercialName,
        nif: form.nif,
        address: form.address,
        plan: form.plan,
      });

      navigate('/admin/companies');
    } catch (err) {
      setError(err.message || 'Error al crear la empresa');
    } finally {
      setLoading(false);
    }
  }

  /* ───────── RENDER ───────── */

  return (
    <div className="container" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h2>Nueva empresa</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Razón social *</label>
          <input
            name="legalName"
            value={form.legalName}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Nombre comercial</label>
          <input
            name="commercialName"
            value={form.commercialName}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>NIF *</label>
          <input
            name="nif"
            value={form.nif}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Dirección *</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label>Plan</label>
          <select
            name="plan"
            value={form.plan}
            onChange={handleChange}
          >
            <option value="BASIC">Basic</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
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
            {loading ? 'Creando…' : 'Crear empresa'}
          </button>
        </div>
      </form>
    </div>
  );
}