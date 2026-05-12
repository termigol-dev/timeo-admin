// src/components/profile/DangerZoneCard.jsx

import React from 'react';

import {
  LifeBuoy,
} from 'lucide-react';

export default function DangerZoneCard() {

  return (

    <div
      style={{
        background: 'white',

        border:
          '1px solid #e2e8f0',

        borderRadius: 28,

        padding: 30,

        boxShadow:
          '0 4px 20px rgba(15,23,42,0.04)',

        marginBottom: 40,
      }}
    >

      {/* HEADER */}
      <div
        style={{
          marginBottom: 30,
        }}
      >

        <p
          className="labelStyle"
          style={{
            marginBottom: 10,
          }}
        >
          EMPRESA
        </p>

        <h2
          style={{
            margin: 0,

            fontSize: 32,

            fontWeight: 700,

            color: '#0f172a',

            marginBottom: 14,
          }}
        >
          Gestión avanzada
        </h2>

        <p
          style={{
            margin: 0,

            color: '#64748b',

            lineHeight: 1.8,

            maxWidth: 760,
          }}
        >
          Algunas acciones avanzadas pueden
          afectar permanentemente a la empresa
          y a los datos asociados.
        </p>

      </div>

      {/* WARNING */}
      <div
        className="inputStyle"
        style={{
          width: '100%',

          padding: 24,

          marginBottom: 30,

          background:
            'rgba(255,255,255,0.72)',
        }}
      >

        <h3
          style={{
            marginTop: 0,

            marginBottom: 16,

            color: '#0f172a',

            fontSize: 20,

            fontWeight: 700,
          }}
        >
          Eliminar empresa
        </h3>

        <p
          style={{
            margin: 0,

            color: '#64748b',

            lineHeight: 1.8,
          }}
        >
          Esta acción eliminará empleados,
          sucursales, horarios, registros
          e incidencias asociados a la empresa.
          La información no podrá recuperarse.
        </p>

      </div>

      {/* ACTIONS */}
      <div
        style={{
          display: 'flex',

          alignItems: 'center',

          gap: 28,

          flexWrap: 'wrap',
        }}
      >

        <button
          className="pillButton"
          style={{
            background: '#dc2626',
            color: 'white',
            fontWeight: 700,
          }}
        >
          Eliminar empresa
        </button>

        <div
          className="dashboard-grid"
          style={{
            flexDirection: 'row',

            gap: 0,

            justifyContent: 'center',

            width: 'auto',
          }}
        >

          <button>

            <LifeBuoy size={18} />

            <span>
              Contactar soporte
            </span>

          </button>

        </div>

      </div>

    </div>
  );
}