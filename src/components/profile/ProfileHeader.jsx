// src/components/profile/ProfileHeader.jsx

import React from 'react';
import '../../style.css';

export default function ProfileHeader({
  companyName,
  companyLogo,
  plan,
  subscriptionStatus,
  billingPeriod,
  price,
  renewalDate,
}) {

  const planClass = {

    BASIC:
      'planCard planCardBasic',

    PRO:
      'planCard planCardPro',

    BUSINESS:
      'planCard planCardBusiness',

  }[plan] || 'planCard planCardBasic';

  const statusConfig = {

    ACTIVE: {
      label: '✓ Activa',
      color: '#15803d',
    },

    TRIAL: {
      label: '⏳ Prueba',
      color: '#0f766e',
    },

    CANCELED: {
      label: '✕ Cancelada',
      color: '#dc2626',
    },

    PAST_DUE: {
      label: '⚠ Pago pendiente',
      color: '#c2410c',
    },
  };

  const currentStatus =
    statusConfig[subscriptionStatus] ||
    {
      label: 'Desconocido',
      color: '#64748b',
    };

  return (

    <div className={planClass}>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          alignItems: 'center',
          gap: 48,
        }}
      >

        {/* LEFT */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >

          {/* TOP ROW */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr',
              gap: 24,
              alignItems: 'center',
            }}
          >

            {/* LOGO */}
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 28,
                overflow: 'hidden',

                background: 'rgba(255,255,255,0.72)',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                fontSize: 42,
                fontWeight: 700,
                color: '#0f172a',

                flexShrink: 0,
              }}
            >

              {companyLogo ? (

                <img
                  src={companyLogo}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

              ) : (

                companyName?.[0] || '?'

              )}

            </div>

            {/* COMPANY NAME */}
            <div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 58,
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1,
                }}
              >
                {companyName}
              </h1>

            </div>

          </div>

          {/* BOTTOM ROW */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >

            {/* PLAN */}
            <div
              className="inputStyle"
              style={{
                width: 'auto',
                padding: '12px 20px',

                fontWeight: 700,
                fontSize: 18,

                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              ✨ {plan}
            </div>

            {/* STATUS */}
            <div
              className="inputStyle"
              style={{
                width: 'auto',
                padding: '12px 20px',

                fontWeight: 700,
                fontSize: 18,

                color: currentStatus.color,
              }}
            >
              {currentStatus.label}
            </div>

            <button
              className="pillButton"
              style={{
                background: '#ffedd5',
                color: '#ea580c',
                fontWeight: 700,
              }}
            >
              Pasar a PRO
            </button>

            <button
              className="pillButton"
              style={{
                fontWeight: 700,
              }}
            >
              Pasar a BUSINESS
            </button>

          </div>

        </div>

        {/* RIGHT */}
        <div
          style={{
            textAlign: 'right',
            minWidth: 220,
            paddingRight: 18,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >

          <p
            className="labelStyle"
            style={{
              marginBottom: 8,
            }}
          >
            PRECIO ACTUAL
          </p>

          <h2
            style={{
              margin: 0,

              fontSize: 56,

              fontWeight: 700,

              color: '#0f172a',

              lineHeight: 1,
            }}
          >
            {price}

            <span
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: '#64748b',
                marginLeft: 6,
              }}
            >
              / mes
            </span>

          </h2>

          {/* PERIOD */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 18,
              marginBottom: 18,
            }}
          >

            <button
              className="pillButton"
              style={{
                opacity:
                  billingPeriod === 'MONTHLY'
                    ? 1
                    : 0.45,
              }}
            >
              Mensual
            </button>

            <button
              className="pillButton"
              style={{
                opacity:
                  billingPeriod === 'YEARLY'
                    ? 1
                    : 0.45,
              }}
            >
              Anual
            </button>

          </div>

          {/* RENEWAL */}
          <div
            className="inputStyle"
            style={{
              width: 'fit-content',
              marginLeft: 'auto',
              padding: '12px 18px',
              background:
                'rgba(255,255,255,0.72)',
            }}
          >

            <div
              className="labelStyle"
              style={{
                marginBottom: 5,
              }}
            >
              PRÓXIMA RENOVACIÓN
            </div>

            <div
              style={{
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {renewalDate || '—'}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}