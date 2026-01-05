import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompany, updateCompany } from './api';

export default function CompanyProfile() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const isSuperAdmin = user.role === 'SUPERADMIN';

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line
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

      // 🔐 solo SUPERADMIN puede tocar datos legales
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

  if (loading) {
    return <div className="center">Cargando empresa…</div>;
  }

  if (!company) {
    return <div className="center">Empresa no encontrada</div>;
  }

  return (
    <div className="container company-profile">
      {/* HEADER */}
      <div className="page-header">
        <h2>Perfil de empresa</h2>
        <button onClick={() => navigate('/admin/companies')}>
          ← Volver
        </button>
      </div>

      {/* FORMULARIO */}
      <div className="company-form">
        <div className="form-group">
          <label>Nombre comercial</label>
          <input
            value={company.commercialName || ''}
            onChange={e =>
              setCompany({
                ...company,
                commercialName: e.target.value,
              })
            }
          />
        </div>

        {isSuperAdmin && (
          <>
            <div className="form-group">
              <label>Razón social</label>
              <input
                value={company.legalName || ''}
                onChange={e =>
                  setCompany({
                    ...company,
                    legalName: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>NIF</label>
              <input
                value={company.nif || ''}
                onChange={e =>
                  setCompany({
                    ...company,
                    nif: e.target.value,
                  })
                }
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label>Dirección</label>
          <input
            value={company.address || ''}
            onChange={e =>
              setCompany({
                ...company,
                address: e.target.value,
              })
            }
          />
        </div>

        <div className="form-group">
          <label>Plan</label>
          <input
            value={company.plan || ''}
            onChange={e =>
              setCompany({
                ...company,
                plan: e.target.value,
              })
            }
          />
        </div>

        {/* ACCIONES */}
        <div className="tablet-actions">
          <button onClick={save} disabled={saving}>
            Guardar cambios
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
          <p className="muted" style={{ marginTop: 16 }}>
            El nombre legal y el NIF solo pueden ser modificados por
            un superadministrador.
          </p>
        )}
      </div>
    </div>
  );
}