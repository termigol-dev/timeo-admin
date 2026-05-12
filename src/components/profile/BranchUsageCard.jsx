// src/components/profile/BranchUsageCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BranchUsageCard({
  companyId,
  branches = [],
  branchesUsed,
  branchesLimit,
}) {

  const emptySlots =
    branchesLimit - branchesUsed > 0
      ? branchesLimit - branchesUsed
      : 0;
  const navigate = useNavigate();
  const reachedLimit =
    branchesUsed >= branchesLimit;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 24,
        padding: 28,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
          marginBottom: 28,
        }}
      >

        <div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: '#64748b',
              marginBottom: 10,
              letterSpacing: 0.5,
            }}
          >
            SUCURSALES
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 600,
              color: '#0f172a',
            }}
          >
            {branchesUsed} / {branchesLimit} sucursales
          </h2>

          {reachedLimit && (
            <p
              style={{
                marginTop: 12,
                marginBottom: 0,
                fontSize: 14,
                color: '#64748b',
              }}
            >
              Has alcanzado el límite de sucursales de tu plan
            </p>
          )}
        </div>

        <button
          type="button"
          className="pillButton"
          onClick={() =>
            navigate(`/admin/companies/${companyId}/branches/new`)
          }
        >
          Añadir sucursal
        </button>
      </div>

      {/* VISUAL */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
        }}
      >

        {branches.map(branch => (
          <div
            key={branch.id}
            style={{
              minWidth: 90,
              height: 54,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <button
              className="pillButton"
              onClick={() =>
                navigate(
                  `/admin/companies/${companyId}/branches/${branch.id}`
                )
              }
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              {branch.name}
            </button>
          </div>
        ))}

        {/* HUECOS VACÍOS */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div
            key={index}
            style={{
              minWidth: 90,
              height: 54,
              borderRadius: 999,
              background: '#eef2f7',
              border: '2px dashed #cbd5e1',
            }}
          />
        ))}

      </div>
    </div>
  );
}