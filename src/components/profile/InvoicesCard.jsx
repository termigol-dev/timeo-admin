// src/components/profile/InvoicesCard.jsx

import React from 'react';

import {
  FileText,
  Download,
  Search,
  FileSearch,
} from 'lucide-react';

const mockInvoices = [
  {
    id: 'INV-2026-001',
    date: '12 mayo 2026',
    amount: '61€',
    status: 'Pagada',
  },

  {
    id: 'INV-2026-002',
    date: '12 abril 2026',
    amount: '59€',
    status: 'Pagada',
  },

  {
    id: 'INV-2026-003',
    date: '12 marzo 2026',
    amount: '59€',
    status: 'Pagada',
  },
];

export default function InvoicesCard() {

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
          marginBottom: 32,
        }}
      >

        <div>

          <p
            className="labelStyle"
            style={{
              marginBottom: 10,
            }}
          >
            FACTURAS
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            Historial de facturación
          </h2>

        </div>

        <div
          className="dashboard-grid"
          style={{
            flexDirection: 'row',
            gap: 0,

            opacity: 0.45,

            pointerEvents: 'none',
          }}
        >

          <button>

            <FileSearch size={18} />

            <span>Consultar facturas</span>

          </button>

        </div>

      </div>

      {/* LIST */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >

        {mockInvoices.map(invoice => (

          <div
            key={invoice.id}
            style={{
              border: '1px solid #e2e8f0',

              borderRadius: 24,

              padding: 24,

              display: 'grid',

              gridTemplateColumns:
                '1fr auto',

              gap: 24,

              alignItems: 'center',

              background: 'white',

              transition:
                'all 0.2s ease',
            }}
          >

            {/* LEFT */}
            <div>

              <h3
                style={{
                  margin: 0,

                  fontSize: 20,

                  fontWeight: 700,

                  color: '#0f172a',

                  marginBottom: 10,
                }}
              >
                {invoice.id}
              </h3>

              <p
                style={{
                  margin: 0,

                  color: '#64748b',

                  fontSize: 14,

                  fontWeight: 500,
                }}
              >
                {invoice.date}
              </p>

            </div>

            {/* RIGHT */}
            <div
              style={{
                display: 'grid',

                gridTemplateColumns:
                  'auto auto',

                gridTemplateRows:
                  'auto auto',

                columnGap: 22,

                rowGap: 12,

                alignItems: 'center',
              }}
            >

              {/* PRICE */}
              <h2
                style={{
                  margin: 0,

                  fontSize: 34,

                  fontWeight: 700,

                  color: '#0f172a',

                  lineHeight: 1,
                }}
              >
                {invoice.amount}
              </h2>

              {/* STATUS */}
              <div
                style={{
                  background: '#dcfce7',

                  color: '#166534',

                  borderRadius: 999,

                  padding: '10px 18px',

                  fontSize: 13,

                  fontWeight: 700,

                  width: 'fit-content',
                }}
              >
                {invoice.status}
              </div>

              {/* PDF */}
              <div
                className="dashboard-grid"
                style={{
                  flexDirection: 'row',
                  gap: 0,

                  gridColumn: '1 / span 2',

                  justifyContent: 'flex-end',
                }}
              >

                <button>

                  <FileText size={18} />

                  <span>Descargar PDF</span>

                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}