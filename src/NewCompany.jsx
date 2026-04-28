import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompany } from './api';
import { getMe } from './api';
export default function NewCompany() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    legalName: '',
    commercialName: '',
    nif: '',
    address: '',
    plan: 'FREE',
  });

  // 🔥 NUEVO
  const [branchName, setBranchName] = useState('Principal');
  const [sameAddress, setSameAddress] = useState(true);
  const [branchAddress, setBranchAddress] = useState('');

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function onSelectLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result);
      setLogoFile(reader.result);
    };
    reader.readAsDataURL(file);
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

      const data = await createCompany({
        ...form,
        logoUrl: logoFile || null,

        // 🔥 NUEVO
        branchName,
        branchAddress: sameAddress ? form.address : branchAddress,
      });

      const currentUser = JSON.parse(localStorage.getItem('user'));

      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        companyId: data.id,
        companyName: form.commercialName || form.legalName,
      }));

      localStorage.setItem('onboarding_step', 'company_created');
      // 🔥 REFRESCAR USER DESDE BACKEND
      const freshUser = await getMe();

      localStorage.setItem('user', JSON.stringify(freshUser));

      // 🔥 marcar onboarding
      localStorage.setItem('onboarding_step', 'company_created');

      navigate('/admin');

    } catch (err) {
      setError(err.message || 'Error al crear la empresa');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>

      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <h2 style={{ margin: 0 }}>Nueva empresa</h2>

        <div className="tablet-actions">
          <button onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>

      <div style={{
        background: '#f8fafc',
        borderRadius: 20,
        padding: 24,
        border: '1px solid #e2e8f0',
      }}>

        {/* LOGO */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 24,
          gap: 16,
        }}>
          <div style={{
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
          }}>
            {logoPreview ? (
              <img
                src={logoPreview}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              form.commercialName?.[0] || form.legalName?.[0] || '🏢'
            )}
          </div>

          <div>
            <div style={{ fontWeight: 600 }}>
              {form.commercialName || form.legalName || 'Nueva empresa'}
            </div>

            <label style={labelStyle}>Logo</label>
            <div style={{ marginTop: 6 }}>
              <label style={photoButtonStyle}>
                Cambiar
                <input
                  type="file"
                  accept="image/*"
                  onChange={onSelectLogo}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* EMPRESA */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
        }}>
          <Field label="Razón social *">
            <input name="legalName" value={form.legalName} onChange={handleChange} style={inputStyle} />
          </Field>

          <Field label="Nombre comercial">
            <input name="commercialName" value={form.commercialName} onChange={handleChange} style={inputStyle} />
          </Field>

          <Field label="NIF *">
            <input name="nif" value={form.nif} onChange={handleChange} style={inputStyle} />
          </Field>

          <Field label="Dirección *">
            <input name="address" value={form.address} onChange={handleChange} style={inputStyle} />
          </Field>
        </div>

        {/* 🔥 SUCURSAL */}
        <div style={{ marginTop: 32 }}>
          <h3 style={{ marginBottom: 16 }}>Sucursal inicial</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}>
            <Field label="Nombre de la sucursal">
              <input
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Dirección">
              <input
                value={sameAddress ? form.address : branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
                style={inputStyle}
                disabled={sameAddress}
              />
            </Field>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>
              <input
                type="checkbox"
                checked={sameAddress}
                onChange={() => setSameAddress(!sameAddress)}
              />
              {' '}Misma dirección que la empresa
            </label>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="tablet-actions" style={{ marginTop: 32 }}>
          <button onClick={() => navigate(-1)}>
            Cancelar
          </button>

          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando…' : 'Crear empresa'}
          </button>
        </div>

        {error && (
          <p style={{ marginTop: 12, fontSize: 13, color: 'red' }}>
            {error}
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

const photoButtonStyle = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 12,
  cursor: 'pointer',
};