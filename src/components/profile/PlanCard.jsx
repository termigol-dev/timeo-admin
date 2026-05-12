// src/components/profile/PlanCard.jsx

import React from 'react';

export default function PlanCard({
  plan,
  billingPeriod,
  price,
  renewalDate,
}) {

  const isYearly = billingPeriod === 'YEARLY';

  const planColors = {
    FREE: {
      bg: '#f1f5f9',
      text: '#475569',
      soft: '#cbd5e1',
    },

    PRO: {
      bg: '#fff7ed',
      text: '#ea580c',
      soft: '#fdba74',
    },

    BUSINESS: {
      bg: '#ecfeff',
      text: '#0891b2',
      soft: '#67e8f9',
    },
  };

  const currentPlan =
    planColors[plan] || planColors.FREE;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 30,
        padding: 32,
        boxShadow: '0 10px 30px rgba(148,163,184,0.08)',
        border: '1px solid #eef2f7',
      }}
    >

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 32,
          flexWrap: 'wrap',
        }}
      >

        {/* IZQUIERDA */}
        <div>

          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: '#94a3b8',
              marginBottom: 12,
              letterSpacing: 1,
            }}
          >
            PLAN ACTUAL
          </p>

          {/* PLAN */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >

            <h2
              style={{
                margin: 0,
                fontSize: 34,
                fontWeight: 700,
                color: '#334155',
                letterSpacing: -1,
              }}
            >
              {plan}
            </h2>

            <div
              style={{
                background: currentPlan.bg,
                color: currentPlan.text,
                border: `1px solid ${currentPlan.soft}`,
                borderRadius: 999,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ACTIVO
            </div>

          </div>

          {/* BILLING SWITCH */}
          <div
            style={{
              marginTop: 22,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >

            {/* MENSUAL */}
            <button
              style={{
                border: !isYearly
                  ? '1px solid #67e8f9'
                  : '1px solid #dbe2ea',

                background: !isYearly
                  ? '#ecfeff'
                  : 'white',

                color: !isYearly
                  ? '#0891b2'
                  : '#475569',

                borderRadius: 999,
                padding: '11px 18px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: '0.2s',
              }}
            >
              Mensual
            </button>

            {/* ANUAL */}
            <button
              style={{
                border: isYearly
                  ? '1px solid #67e8f9'
                  : '1px solid #dbe2ea',

                background: isYearly
                  ? '#ecfeff'
                  : 'white',

                color: isYearly
                  ? '#0891b2'
                  : '#475569',

                borderRadius: 999,
                padding: '11px 18px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: '0.2s',
              }}
            >
              Anual
            </button>

          </div>

        </div>

        {/* DERECHA */}
        <div
          style={{
            textAlign: 'right',
          }}
        >

          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: '#94a3b8',
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            Precio actual
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >

            <h2
              style={{
                margin: 0,
                fontSize: 48,
                fontWeight: 700,
                color: '#334155',
                letterSpacing: -2,
                lineHeight: 1,
              }}
            >
              {price}€
            </h2>

            <span
              style={{
                color: '#94a3b8',
                fontSize: 15,
                marginBottom: 6,
              }}
            >
              / {isYearly ? 'año' : 'mes'}
            </span>

          </div>

          <div
            style={{
              marginTop: 24,
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: 18,
              border: '1px solid #eef2f7',
            }}
          >

            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: '#94a3b8',
                marginBottom: 6,
              }}
            >
              Próxima renovación
            </p>

            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: '#475569',
              }}
            >
              {renewalDate}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}