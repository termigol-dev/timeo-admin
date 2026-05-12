// src/components/profile/SubscriptionCard.jsx
import React from 'react';

export default function SubscriptionCard({
  plan,
  setUpgradeOpen,
}) {

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
          marginBottom: 28,
        }}
      >
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
          SUSCRIPCIÓN
        </p>

        <h2
          style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Gestionar suscripción
        </h2>
      </div>

      {/* GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}
      >

        {/* UPGRADE */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 22,
            padding: 24,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 14,
              fontSize: 22,
              color: '#0f172a',
            }}
          >
            Mejorar plan
          </h3>

          <p
            style={{
              marginTop: 0,
              marginBottom: 24,
              color: '#64748b',
              lineHeight: 1.6,
            }}
          >
            Amplía los límites de tu empresa
            y desbloquea más funcionalidades.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <button
  className="pillButton"
  onClick={() => setUpgradeOpen(true)}
  style={{
    color: '#ea580c',
    borderColor: '#fdba74',
  }}
>
  Pasar a PRO
</button>

            <button
              className="pillButton"
              onClick={() => setUpgradeOpen(true)}
            >
              Pasar a BUSINESS
            </button>

          </div>
        </div>

        

        {/* CANCELAR */}
        <div
          style={{
            border: '1px solid #fee2e2',
            borderRadius: 22,
            padding: 24,
            background: '#fffafa',
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 14,
              fontSize: 22,
              color: '#991b1b',
            }}
          >
            Cancelar suscripción
          </h3>

          <p
            style={{
              marginTop: 0,
              marginBottom: 24,
              color: '#7f1d1d',
              lineHeight: 1.6,
            }}
          >
            Tu empresa permanecerá accesible
            en modo consulta hasta reactivar
            la suscripción.
          </p>

          <button
            style={{
              border: 'none',
              background: '#dc2626',
              color: 'white',
              borderRadius: 999,
              padding: '12px 18px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancelar renovación
          </button>
        </div>

      </div>
    </div>
  );
}