// src/components/profile/BillingCard.jsx
import React from 'react';
import '../../style.css';
import Logo from '../Logo';

export default function BillingCard({
  cardLast4,
  price,
  billingPeriod,
}) {

  const isYearly =
    billingPeriod === 'YEARLY';

  return (

    <div className="planCard planCardPro">

      {/* HEADER */}
      <div
        style={{
          marginBottom: 32,
        }}
      >

        <p
          className="labelStyle"
          style={{
            marginBottom: 12,
          }}
        >
          FACTURACIÓN
        </p>

        <h2
          style={{
            margin: 0,
            fontSize: 34,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Método de pago
        </h2>

      </div>

      {/* GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(320px, 1fr))',

          gap: 24,
        }}
      >

        {/* CREDIT CARD */}
        <div
          style={{
            position: 'relative',

            overflow: 'hidden',

            borderRadius: 30,

            padding: 30,

            minHeight: 220,

            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',

            background:
              'linear-gradient(135deg, #fdba74 0%, #fb923c 100%)',

            boxShadow:
              '0 18px 40px rgba(251,146,60,0.22)',
          }}
        >

          {/* LIGHT */}
          <div
            style={{
              position: 'absolute',

              top: -80,
              right: -80,

              width: 220,
              height: 220,

              borderRadius: '50%',

              background:
                'rgba(255,255,255,0.12)',
            }}
          />

          {/* TOP */}
          <div
            style={{
              position: 'relative',

              display: 'flex',
              flexDirection: 'column',

              gap: 22,
            }}
          >

            {/* HEADER */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >

              <div
                style={{
                  fontSize: 13,

                  fontWeight: 700,

                  color:
                    'rgba(255,255,255,0.72)',

                  letterSpacing: 1,
                }}
              >
                TARJETA PRINCIPAL
              </div>

              <Logo
                dark
                size={92}
              />

            </div>

            {/* NUMBER */}
            <div
              style={{
                fontSize: 34,

                fontWeight: 700,

                color: 'white',

                letterSpacing: 4,

                lineHeight: 1.2,
              }}
            >
              **** **** **** {cardLast4}
            </div>

          </div>

          {/* BOTTOM */}
          <div
            style={{
              position: 'relative',

              display: 'flex',

              justifyContent: 'space-between',

              alignItems: 'flex-end',

              gap: 20,
            }}
          >

            {/* HOLDER */}
            <div>

              <div
                style={{
                  fontSize: 11,

                  fontWeight: 600,

                  color:
                    'rgba(255,255,255,0.65)',

                  marginBottom: 6,

                  letterSpacing: 1,
                }}
              >
                TITULAR
              </div>

              <div
                style={{
                  fontSize: 17,

                  fontWeight: 700,

                  color: 'white',
                }}
              >
                PABLO ESTEBAN
              </div>

            </div>

            {/* EXPIRES */}
            <div>

              <div
                style={{
                  fontSize: 11,

                  fontWeight: 600,

                  color:
                    'rgba(255,255,255,0.65)',

                  marginBottom: 6,

                  letterSpacing: 1,
                }}
              >
                CADUCA
              </div>

              <div
                style={{
                  fontSize: 17,

                  fontWeight: 700,

                  color: 'white',
                }}
              >
                12/28
              </div>

            </div>

          </div>

        </div>

        {/* SUMMARY */}
        <div
          className="inputStyle"
          style={{
            width: '100%',

            padding: 28,

            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',

            background:
              'rgba(255,255,255,0.7)',
          }}
        >

          <div>

            <p
              className="labelStyle"
              style={{
                marginBottom: 14,
              }}
            >
              RESUMEN ACTUAL
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
                marginBottom: 26,
              }}
            >

              <h2
                style={{
                  margin: 0,

                  fontSize: 54,

                  fontWeight: 700,

                  color: '#0f172a',

                  lineHeight: 1,
                }}
              >
                {price}€
              </h2>

              <span
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: '#64748b',
                  marginBottom: 6,
                }}
              >
                / {isYearly ? 'año' : 'mes'}
              </span>

            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >

                <span
                  style={{
                    color: '#64748b',
                  }}
                >
                  Plan actual
                </span>

                <strong
                  style={{
                    color: '#0f172a',
                  }}
                >
                  Incluido
                </strong>

              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >

                <span
                  style={{
                    color: '#64748b',
                  }}
                >
                  Empleados extra
                </span>

                <strong
                  style={{
                    color: '#0f172a',
                  }}
                >
                  +2€
                </strong>

              </div>

            </div>

          </div>

          {/* ACTIONS */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 30,
              flexWrap: 'wrap',
            }}
          >

            <button className="pillButton">
              Cambiar tarjeta
            </button>


          </div>

        </div>

      </div>

    </div>
  );
}