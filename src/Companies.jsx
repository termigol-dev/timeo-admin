import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanies, deleteCompany } from './api';

export default function Companies() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    setLoading(true);
    try {
      const data = await getCompanies();
      setCompanies(data || []);
    } finally {
      setLoading(false);
    }
  }

  /* ───────── BORRADO DEFINITIVO (TEST) ───────── */
  async function removeCompany(company) {
    const ok = window.confirm(
      '⚠️ BORRADO DEFINITIVO (TEST)\n\n' +
        'Esta acción eliminará la empresa y todos sus datos.\n\n' +
        '¿Deseas continuar?',
    );

    if (!ok) return;

    try {
      await deleteCompany(company.id);
      loadCompanies();
    } catch (err) {
      alert(err.message || 'Error al eliminar la empresa');
    }
  }

  const filtered = companies.filter(c =>
    `${c.legalName} ${c.commercialName || ''} ${c.nif}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  if (loading) {
    return <div className="center">Cargando empresas…</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>
     <div className="page-header" style={{ marginBottom: 24 }}>
  <h2>Empresas</h2>

  <div className="tablet-actions">
    <button onClick={() => navigate('/admin/companies/new')}>
      + Nueva empresa
    </button>
  </div>
</div>

      <input
        className="search"
        placeholder="Buscar por nombre o NIF…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <table className="table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>NIF</th>
            <th>Plan</th>
            <th>Activa</th>
            <th className="right">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map(c => (
            <tr key={c.id}>
              <td>
                <div className="company-line">
                  <strong>{c.commercialName || c.legalName}</strong>
                  <span className="company-legal">{c.legalName}</span>
                </div>
              </td>

              <td>{c.nif}</td>
              <td>{c.plan}</td>
              <td>{c.active ? 'Sí' : 'No'}</td>

              <td className="right">
                <div className="tablet-actions">
                  <button
                    onClick={() =>
                      navigate(`/admin/companies/${c.id}`)
                    }
                  >
                    Ver
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/admin/companies/${c.id}/branches`)
                    }
                  >
                    Sucursales
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/admin/companies/${c.id}/employees`)
                    }
                  >
                    Empleados
                  </button>

                  <button
                    onClick={() => removeCompany(c)}
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    Eliminar (TEST)
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan="5" className="center muted">
                No hay empresas registradas
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}