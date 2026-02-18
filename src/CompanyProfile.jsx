import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompany, updateCompany } from './api';

export default function CompanyProfile() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.role === 'SUPERADMIN';

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [companyId]);

  async function load() {
    setLoading(true);
    try {
      const data = await getCompany(companyId);
      setCompany(data);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        commercialName: company.commercialName,
        address: company.address,
        plan: company.plan,
      };

      if (isSuperAdmin) {
        payload.legalName = company.legalName;
        payload.nif = company.nif;
      }

      await updateCompany(companyId, payload);
      alert('Empresa actualizada');
      load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="center">Cargando empresa…</div>;
  if (!company) return <div className="center">Empresa no encontrada</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <h2 style={{ margin: 0 }}>Perfil de empresa</h2>

        <div className="tablet-actions">
          <button onClick={() => navigate('/admin/companies')}>
            ← Volver
          </button>
        </div>
      </div>

      {/* CARD */}
      <div
        style={{
          background: '#f8fafc',   // ligeramente más oscuro que blanco
          borderRadius: 20,
          padding: 40,
          border: '1px solid #e2e8f0',
        }}
      >
        {/* GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 28,
          }}
        >
          {/* Nombre comercial */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Nombre comercial
            </label>
            <input
              style={inputStyle}
              value={company.commercialName || ''}
              onChange={e =>
                setCompany({ ...company, commercialName: e.target.value })
              }
            />
          </div>

          {/* Dirección */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Dirección
            </label>
            <input
              style={inputStyle}
              value={company.address || ''}
              onChange={e =>
                setCompany({ ...company, address: e.target.value })
              }
            />
          </div>

          {/* Plan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Plan
            </label>
            <input
              style={inputStyle}
              value={company.plan || ''}
              onChange={e =>
                setCompany({ ...company, plan: e.target.value })
              }
            />
          </div>

          {/* Razón social */}
          {isSuperAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Razón social
              </label>
              <input
                style={inputStyle}
                value={company.legalName || ''}
                onChange={e =>
                  setCompany({ ...company, legalName: e.target.value })
                }
              />
            </div>
          )}

          {/* NIF */}
          {isSuperAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                NIF
              </label>
              <input
                style={inputStyle}
                value={company.nif || ''}
                onChange={e =>
                  setCompany({ ...company, nif: e.target.value })
                }
              />
            </div>
          )}
        </div>

        {/* ACCIONES */}
        <div
          className="tablet-actions"
          style={{
            marginTop: 36,
            display: 'flex',
            gap: 16,
          }}
        >
          <button onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>

          <button
            onClick={() =>
              navigate(`/admin/companies/${companyId}/branches`)
            }
          >
            Ver sucursales
          </button>
        </div>

        {!isSuperAdmin && (
          <p style={{ marginTop: 24, fontSize: 13, opacity: 0.6 }}>
            El nombre legal y el NIF solo pueden ser modificados por un superadministrador.
          </p>
        )}
      </div>
    </div>
  );
}

/* INPUT STYLE */
const inputStyle = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  background: '#ffffff',
  outline: 'none',
};