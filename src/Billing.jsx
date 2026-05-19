import React, {
  useMemo,
  useState,
} from 'react';

import { useLocation } from 'react-router-dom';


const plans = {
  BASIC: {
    name: 'BASIC',

    monthly: 5.99,
    yearly: 59.90,

    employees: 'Hasta 3 empleados',
    branches: '1 sucursal',

    color: '#4fb8ab',
    background: '#f0fdfa',
    border: '#99f6e4',
  },

  PRO: {
    name: 'PRO',

    monthly: 11.99,
    yearly: 119.90,

    employees: 'Hasta 10 empleados',
    branches: '3 sucursales',

    color: '#ea580c',
    background: '#fff7ed',
    border: '#fdba74',
  },

  BUSINESS: {
    name: 'BUSINESS',

    monthly: 24.99,
    yearly: 249.90,

    employees: 'Hasta 20 empleados',
    branches: 'Sucursales ilimitadas',

    color: '#4b7285',
    background: '#f4f8fa',
    border: '#8ba7b5',
  },
};

export default function Billing() {

  const location = useLocation();

const params =
  new URLSearchParams(location.search);

const initialPlan =
  params.get('plan') || 'BASIC';

const [selectedPlan, setSelectedPlan] =
  useState(initialPlan);

  const [billingPeriod, setBillingPeriod] =
    useState('MONTHLY');

  const [setupByPlan, setSetupByPlan] =
    useState({
      BASIC: false,
      PRO: false,
      BUSINESS: false,
    });

  const currentPlan =
    plans[selectedPlan];
  const withSetup =
    setupByPlan[selectedPlan];

  /* PLAN PRICE */
  const basePrice =
    billingPeriod === 'YEARLY'
      ? currentPlan.yearly
      : currentPlan.monthly;

  /* SETUP PRICE */
  let monthlySetupPrice = 0;

  if (selectedPlan === 'BASIC') {
    monthlySetupPrice = 2.99;
  }

  if (selectedPlan === 'PRO') {
    monthlySetupPrice = 5.99;
  }

  if (selectedPlan === 'BUSINESS') {
    monthlySetupPrice = 9.99;
  }

  const yearlySetupPrice =
    Number(
      (monthlySetupPrice * 10)
        .toFixed(2)
    );

  const setupPrice =
    withSetup
      ? (
        billingPeriod === 'YEARLY'
          ? yearlySetupPrice
          : monthlySetupPrice
      )
      : 0;

  /* TOTAL */
  const totalPrice =
    useMemo(() => {

      return Number(
        (
          basePrice +
          setupPrice
        ).toFixed(2)
      );

    }, [
      basePrice,
      setupPrice,
    ]);
async function handleCheckout() {

  try {

    console.log('🔥 HANDLE CHECKOUT');

    const token =
      localStorage.getItem('token');

    console.log('🪙 TOKEN:', token);

    const res = await fetch(
      'https://timeo-backend.onrender.com/billing/checkout',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          plan: selectedPlan,
          billingPeriod,
          withSetup,
          totalPrice: Number(totalPrice),
          basePrice,
          setupPrice,
        }),
      }
    );

    console.log('📡 STATUS:', res.status);

    const text = await res.text();

    console.log('📦 RAW RESPONSE:', text);

    let data = null;

    try {

      data = JSON.parse(text);

      console.log('✅ PARSED JSON:', data);

    } catch (e) {

      console.error(
        '❌ JSON PARSE ERROR',
        e
      );
    }

    if (!data?.url) {

      console.error(
        '❌ NO URL RETURNED'
      );

      return;
    }

    console.log(
      '🚀 REDIRECTING TO:',
      data.url
    );

    window.location.href =
      data.url;

  } catch (error) {

    console.error(
      '❌ CHECKOUT ERROR:',
      error
    );
  }
}

  return (

    <div
      style={{
        maxWidth: 1450,
        margin: '0 auto',
        padding: 40,
      }}
    >

      {/* HEADER */}
      <div
        style={{
          marginBottom: 42,
        }}
      >

        <p
          className="labelStyle"
          style={{
            marginBottom: 10,
          }}
        >
          FACTURACIÓN
        </p>

        <h1
          style={{
            margin: 0,

            fontSize: 52,

            fontWeight: 700,

            color: '#0f172a',

            lineHeight: 1,

            marginBottom: 18,
          }}
        >
          Activar suscripción
        </h1>

        <p
          style={{
            margin: 0,

            fontSize: 18,

            color: '#64748b',

            lineHeight: 1.8,

            maxWidth: 760,
          }}
        >
          Selecciona el plan que mejor
          se adapte a tu empresa y
          continúa al pago seguro
          mediante Stripe.
        </p>

      </div>

      {/* CONTENT */}
      <div
        style={{
          display: 'grid',

          gridTemplateColumns:
            'minmax(0, 1fr) 360px',

          gap: 28,

          alignItems: 'start',
        }}
      >
        {/* LEFT */}
        <div>

          {/* PLAN CARDS */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >

            {Object.values(plans).map(plan => {

              const isSelected =
                selectedPlan === plan.name;

              let setupLabel = '';

              if (plan.name === 'BASIC') {
                setupLabel =
                  billingPeriod === 'YEARLY'
                    ? '29,90€/año'
                    : '2,99€/mes';
              }

              if (plan.name === 'PRO') {
                setupLabel =
                  billingPeriod === 'YEARLY'
                    ? '59,90€/año'
                    : '5,99€/mes';
              }

              if (plan.name === 'BUSINESS') {
                setupLabel =
                  billingPeriod === 'YEARLY'
                    ? '99,90€/año'
                    : '9,99€/mes';
              }

              return (

                <div
                  key={plan.name}
                  onClick={() => {
                    setSelectedPlan(plan.name);
                  }}
                  style={{
                    border:
                      isSelected
                        ? `2px solid ${plan.border}`
                        : '1px solid #e2e8f0',

                    background:
                      isSelected
                        ? plan.background
                        : `${plan.background}80`,

                    borderRadius: 30,

                    padding: 28,

                    textAlign: 'left',

                    cursor: 'pointer',

                    transition:
                      'all 0.2s ease',
                    boxShadow:
                      isSelected
                        ? (
                          plan.name === 'BASIC'
                            ? '0 18px 80px rgba(20,184,166,0.18)'
                            : plan.name === 'PRO'
                              ? '0 18px 80px rgba(234,88,12,0.18)'
                              : '0 18px 80px rgba(75,114,133,0.18)'
                        )
                        : '0 4px 80px rgba(15,23,42,0.04)',
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',

                      gap: 28,

                      flexWrap: 'wrap',
                    }}
                  >

                    {/* LEFT */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 260,
                      }}
                    >

                      {/* TOP */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,

                          marginBottom: 20,
                        }}
                      >

                        {/* CHECK */}
                        <div
                          style={{
                            width: 26,
                            height: 26,

                            borderRadius: 999,

                            border:
                              isSelected
                                ? `25px solid ${plan.color}`
                                : `2px solid ${plan.border}`,

                            background:
                              'white',

                            transition:
                              '0.2s ease',
                          }}
                        />

                        {/* PLAN */}
                        <div
                          style={{
                            fontSize: 28,

                            fontWeight: 700,

                            color: '#0f172a',
                          }}
                        >
                          {plan.name}
                        </div>

                      </div>

                      {/* FEATURES */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 24,
                          marginTop: 6,
                        }}
                      >

                        {/* LEFT */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                          }}
                        >

                          <span
                            style={{
                              color: '#0f172a',
                              fontWeight: 600,
                            }}
                          >
                            ✓ Fichaje y control horario
                          </span>

                          <span
                            style={{
                              color: '#0f172a',
                              fontWeight: 600,
                            }}
                          >
                            ✓ Impresión y exportación de informes
                          </span>

                        </div>

                        {/* RIGHT */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                          }}
                        >

                          <span
                            style={{
                              color: '#0f172a',
                              fontWeight: 600,
                            }}
                          >
                            ✓ {plan.employees}
                          </span>

                          <span
                            style={{
                              color: '#0f172a',
                              fontWeight: 600,
                            }}
                          >
                            ✓ {plan.branches}
                          </span>

                        </div>

                      </div>

                      {/* ADDON */}
                      <div
                        style={{
                          marginTop: 24,

                          paddingTop: 22,

                          borderTop:
                            '1px solid rgba(148,163,184,0.18)',
                        }}
                      >

                        <label
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              '24px 1fr auto',

                            alignItems: 'center',

                            gap: 14,

                            cursor:
                              selectedPlan === plan.name
                                ? 'pointer'
                                : 'default',
                          }}
                        >

                          <input
                            type="checkbox"

                            checked={setupByPlan[plan.name]}

                            onChange={e =>
                              setSetupByPlan(prev => ({
                                ...prev,
                                [plan.name]:
                                  e.target.checked,
                              }))
                            }

                            style={{
                              width: 20,
                              height: 20,

                              cursor:
                                selectedPlan === plan.name
                                  ? 'pointer'
                                  : 'not-allowed',

                              opacity:
                                selectedPlan === plan.name
                                  ? 1
                                  : 0.35,
                            }}
                          />

                          {/* TEXT */}
                          <div>

                            <div
                              style={{
                                fontWeight: 700,
                                color: '#0f172a',
                                marginBottom: 4,
                              }}
                            >
                              Gestión interna Timeo
                            </div>

                            <div
                              style={{
                                color: '#64748b',
                                fontSize: 14,
                              }}
                            >
                              Gestión de empleados y horarios
                            </div>

                          </div>

                          {/* PRICE */}
                          <div
                            style={{
                              color: '#0f172a',
                              fontWeight: 700,
                              fontSize: 15,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            +{setupLabel}
                          </div>

                        </label>

                      </div>

                    </div>
                    {/* RIGHT */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        minWidth: 240,
                        height: '100%',
                      }}
                    >

                      {/* PRICE */}
                      <div
                        style={{
                          textAlign: 'right',
                        }}
                      >

                        {/* MAIN PRICE */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'flex-end',
                            gap: 8,
                          }}
                        >

                          <span
                            style={{
                              fontSize: 56,
                              fontWeight: 700,
                              color: '#0f172a',
                              lineHeight: 1,
                            }}
                          >
                            {
                              billingPeriod === 'YEARLY'
                                ? plan.yearly.toFixed(2)
                                : plan.monthly.toFixed(2)
                            }
                            €
                          </span>

                          <span
                            style={{
                              fontSize: 18,
                              fontWeight: 600,
                              color: '#64748b',
                              marginBottom: 8,
                            }}
                          >
                            / {
                              billingPeriod === 'YEARLY'
                                ? 'año'
                                : 'mes'
                            }
                          </span>

                        </div>

                        {/* SECONDARY */}
                        <div
                          style={{
                            marginTop: 10,
                            color: '#94a3b8',
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          {
                            billingPeriod === 'YEARLY'
                              ? `${plan.monthly.toFixed(2)}€/mes`
                              : `${plan.yearly.toFixed(2)}€/año`
                          }
                        </div>

                      </div>

                      {/* BOTTOM */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          marginTop: 28,
                        }}
                      >

                        {/* PERIOD BUTTONS */}
                        <div
                          style={{
                            display: 'flex',
                            gap: 10,
                          }}
                        >

                          <button
                            className="pillButton"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBillingPeriod('MONTHLY');
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setBillingPeriod('YEARLY');
                            }}
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

                      </div>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        </div>

        {/* AQUI RIGHT */}
        <div
          style={{
            background: 'white',

            borderRadius: 30,

            padding: 30,

            border:
              '1px solid #e2e8f0',

            position: 'sticky',

            top: 40,
          }}
        >

          <p
            className="labelStyle"
            style={{
              marginBottom: 12,
            }}
          >
            RESUMEN
          </p>

          <h2
            style={{
              margin: 0,

              fontSize: 64,

              fontWeight: 700,

              color: '#0f172a',

              lineHeight: 1,
            }}
          >
            {totalPrice.toFixed(2)}€
          </h2>

          <p
            style={{
              marginTop: 10,

              marginBottom: 34,

              color: '#64748b',

              fontWeight: 600,

              fontSize: 18,
            }}
          >
            / {
              billingPeriod ===
                'YEARLY'
                ? 'año'
                : 'mes'
            }
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,

              marginBottom: 34,
            }}
          >

            {/* PLAN */}
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
              }}
            >
              <span
                style={{
                  color: '#64748b',
                }}
              >
                Plan
              </span>

              <strong>
                Plan {selectedPlan}
              </strong>

            </div>

            {/* BILLING */}
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
              }}
            >
              <span
                style={{
                  color: '#64748b',
                }}
              >
                Facturación
              </span>

              <strong>
                {
                  billingPeriod ===
                    'YEARLY'
                    ? 'Anual'
                    : 'Mensual'
                }
              </strong>

            </div>

            {/* SETUP */}
            {withSetup && (

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                }}
              >
                <span
                  style={{
                    color: '#64748b',
                  }}
                >
                  Gestión interna
                </span>

                <strong>
                  +{setupPrice.toFixed(2)}€
                </strong>

              </div>

            )}

          </div>

          {/* ACTIONS */}
          <div
            style={{
              display: 'flex',
              gap: 14,
            }}
          >

            <button
              className="pillButton"
              style={{
                flex: 1,
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="pillButton"
              onClick={(e) => {

                e.preventDefault();

                e.stopPropagation();

                console.log('🔥 CLICK');

                handleCheckout();
              }}
              style={{
                flex: 1,

                justifyContent: 'center',

                fontWeight: 700,
              }}
            >
              Continuar
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}