import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getBranches,
  deleteBranch,
  toggleBranch,
  regenerateTabletToken, // 🆕
} from './api';
import { QRCodeSVG } from 'qrcode.react';

export default function Branches() {
  const navigate = useNavigate();
  const { companyId } = useParams();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // 🆕 estado tablet
  const [tabletInfo, setTabletInfo] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getBranches(companyId);
      setBranches(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (companyId) load();
  }, [companyId]);

  /* ───────── ACTIVAR / DESACTIVAR ───────── */
  async function toggle(branch) {
    await toggleBranch(companyId, branch.id);
    load();
  }

  /* ───────── TOKEN TABLET ───────── */
  async function handleGenerateTabletToken(branch) {
    const res = await regenerateTabletToken(companyId, branch.id);
    setTabletInfo({
      branchName: branch.name,
      token: res.tabletToken,
    });
  }

  /* ───────── ELIMINAR SUCURSAL ───────── */
  async function removeBranch(branch) {
    if (!branch.memberships || branch.memberships.length === 0) {
      const ok = window.confirm(
        '¿Seguro que quieres eliminar esta sucursal?',
      );
      if (!ok) return;

      await deleteBranch(companyId, branch.id, {
        mode: 'DEACTIVATE_USERS',
      });
      load();
      return;
    }

    const firstChoice = window.prompt(
      'Esta sucursal tiene empleados.\n\n' +
        'A → Eliminarlos del todo\n' +
        'B → Dejarlos inactivos\n' +
        'C → Cancelar',
      'C',
    );

    if (!firstChoice || firstChoice.toUpperCase() === 'C') return;

    if (firstChoice.toUpperCase() === 'A') {
      const secondChoice = window.prompt(
        '⚠️ ELIMINACIÓN DEFINITIVA\n\n' +
          'SI → Eliminar datos\n' +
          'INACTIVOS → Dejarlos inactivos\n' +
          'CANCELAR → Cancelar',
        'CANCELAR',
      );

      if (!secondChoice || secondChoice === 'CANCELAR') return;

      await deleteBranch(companyId, branch.id, {
        mode:
          secondChoice === 'SI'
            ? 'DELETE_USERS'
            : 'DEACTIVATE_USERS',
      });
      load();
    }

    if (firstChoice.toUpperCase() === 'B') {
      await deleteBranch(companyId, branch.id, {
        mode: 'DEACTIVATE_USERS',
      });
      load();
    }
  }

  /* ───────── FILTRO ───────── */
  const filteredBranches = branches.filter(b =>
    `${b.name} ${b.address || ''}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header">
        <h2>Sucursales</h2>

        <div className="tablet-actions">
          <button onClick={() => navigate(-1)}>← Volver</button>
          <button
            onClick={() =>
              navigate(`/admin/companies/${companyId}/branches/new`)
            }
          >
            + Nueva sucursal
          </button>
        </div>
      </div>

      <input
        className="search"
        placeholder="Buscar sucursal…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ marginTop: 24 }}
      />

      {loading ? (
        <div className="center">Cargando sucursales…</div>
      ) : (
        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>ID</th>
              <th>Estado</th>
              <th className="right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredBranches.map(b => (
              <tr key={b.id} style={{ opacity: b.active ? 1 : 0.5 }}>
                <td>{b.name}</td>
                <td>{b.address || '—'}</td>
                <td style={{ fontSize: 12, opacity: 0.6 }}>{b.id}</td>
                <td>{b.active ? 'Activa' : 'Inactiva'}</td>

                <td className="right">
                  <div className="tablet-actions">
                    <button onClick={() => toggle(b)}>
                      {b.active ? 'Desactivar' : 'Activar'}
                    </button>

                    <button
                      disabled={!b.active}
                      onClick={() =>
                        navigate(
                          `/admin/companies/${companyId}/employees?branch=${b.id}`,
                        )
                      }
                    >
                      Empleados
                    </button>

                    {/* 🆕 TABLET */}
                    <button
                      disabled={!b.active}
                      onClick={() =>
                        handleGenerateTabletToken(b)
                      }
                    >
                      Regenerar token tablet
                    </button>

                    <button
                      onClick={() => removeBranch(b)}
                      style={{ backgroundColor: '#ef4444' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredBranches.length === 0 && (
              <tr>
                <td colSpan="5" className="center muted">
                  No hay sucursales registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* ───────── MODAL TOKEN + QR ───────── */}
      {tabletInfo && (
        <div className="modal">
          <div className="card center" style={{ maxWidth: 420 }}>
            <h3>Tablet · {tabletInfo.branchName}</h3>

            <p className="muted">Token</p>
            <code style={{ wordBreak: 'break-all' }}>
              {tabletInfo.token}
            </code>

            <div style={{ margin: '24px 0' }}>
              <QRCodeSVG
                value={`https://timeo-tablet.app/tablet?token=${tabletInfo.token}`}
                size={220}
              />
            </div>

            <button onClick={() => setTabletInfo(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}