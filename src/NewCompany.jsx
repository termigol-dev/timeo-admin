import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompany, getMe } from './api';
import { Check, X } from 'lucide-react';

export default function NewCompany() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    legalName: '',
    commercialName: '',
    nif: '',
    address: '',
  });

  const [selectedPlan, setSelectedPlan] = useState('BASIC');
  const [withManagement, setWithManagement] = useState({
    BASIC: false,
    PRO: false,
    BUSINESS: false
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function onSelectLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result);
      setLogoFile(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.legalName || !form.nif || !form.address) {
      setError('La razón social, el NIF y la dirección son obligatorios');
      return;
    }

    try {
      setLoading(true);

      await createCompany({
        ...form,
        plan: selectedPlan,
        withManagement,
        logoUrl: logoFile || null,
      });

      const freshUser = await getMe();
      localStorage.setItem('user', JSON.stringify(freshUser));

      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Error al crear la empresa');
    } finally {
      setLoading(false);
    }
  }

  const plans = [
    {
      key: 'BASIC',
      name: 'Básico',
      price: '5,99€',
      employees: 'Hasta 3 empleados',
      branches: '1 sucursal',
      extraPrice: '2,99',
    },
    {
      key: 'PRO',
      name: 'Pro',
      price: '10,99€',
      employees: 'Hasta 10 empleados',
      branches: 'Hasta 3 sucursales',
      extraPrice: '4,99',
    },
    {
      key: 'BUSINESS',
      name: 'Business',
      price: '24,99€',
      employees: 'Hasta 20 empleados',
      branches: 'Sucursales ilimitadas',
      extraPrice: '9,99',
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>

      {/* HEADER */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        marginBottom: 24,
        paddingLeft: 50,
        paddingRight: 50
      }}>

        {/* IZQUIERDA */}
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          margin: 0
        }}>
          Nueva empresa
        </h2>

        {/* DERECHA */}
        <div
          className="dashboard-grid"
          style={{
            flexDirection: 'row',  // 🔥 override SOLO aquí
            gap: 0                 // 👈 para que no meta espacio raro
          }}
        >
          <button onClick={() => navigate(-1)}>
            <span>← Volver</span>
          </button>
        </div>

      </div>

      <div style={{
        background: '#f8fafc',
        borderRadius: 20,
        padding: 24,
        border: '1px solid #e2e8f0',
      }}>

        {/* LOGO */}
        <div style={{
          display: 'flex',
          gap: 16,
          marginBottom: 32,
          alignItems: 'center'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {logoPreview ? (
              <img src={logoPreview} style={{ width: '100%', height: '100%' }} />
            ) : (
              form.commercialName?.[0] || '🏢'
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            {/* 👇 convertido a button */}
            <button
              type="button"
              onClick={() => document.getElementById('logoInput').click()}
            >
              <span>Seleccionar archivo</span>
            </button>

            <input
              id="logoInput"
              type="file"
              onChange={onSelectLogo}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* FORM */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: 48,
          rowGap: 28,
        }}>
          <Field label="Razón social *">
            <input name="legalName" value={form.legalName} onChange={handleChange} style={inputStyle} />
          </Field>

          <Field label="Nombre comercial">
            <input name="commercialName" value={form.commercialName} onChange={handleChange} style={inputStyle} />
          </Field>

          <Field label="NIF *">
            <input name="nif" value={form.nif} onChange={handleChange} style={inputStyle} />
          </Field>

          <Field label="Dirección *">
            <input name="address" value={form.address} onChange={handleChange} style={inputStyle} />
          </Field>
        </div>

        {/* PLANES */}
        <div style={{ marginTop: 40 }}>
          <h3 style={{ paddingLeft: 8 }}>
            Elige tu plan
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {plans.map(plan => {
              const active = selectedPlan === plan.key;

              const colors = {
                BASIC: {
                  bg: '#f0fdfa',
                  border: '#99f6e4',
                  activeBorder: '#14b8a6'
                },
                PRO: {
                  bg: '#fff7ed',
                  border: '#fed7aa',
                  activeBorder: '#f97316'
                },
                BUSINESS: {
                  bg: '#f0f9ff',
                  border: '#bae6fd',
                  activeBorder: '#0284c7'
                }
              };

              const c = colors[plan.key];

              return (
                <div
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  style={{
                    cursor: 'pointer',
                    border: active
                      ? `3px solid ${c.activeBorder}`
                      : `1px solid ${c.border}`,
                    borderRadius: 16,
                    padding: 16,
                    background: active ? '#ffffff' : c.bg,
                    transition: 'all 0.2s ease',

                    // 🔥 EFECTO FUERTE
                    boxShadow: active
                      ? '0 18px 40px rgba(0,0,0,0.18)'
                      : '0 2px 6px rgba(0,0,0,0.04)',

                    transform: active
                      ? 'translateY(-8px)'
                      : 'translateY(0)',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.boxShadow = '0 12px 26px rgba(0,0,0,0.14)';
                      e.currentTarget.style.transform = 'translateY(-5px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* 🔥 INDICADOR CLARO */}
                  {active && (
                    <div style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: c.activeBorder,
                      marginBottom: 8,
                      letterSpacing: 0.5
                    }}>
                      ✓ SELECCIONADO
                    </div>
                  )}

                  <div style={{
                    fontWeight: 600,
                    color: active ? c.activeBorder : '#0f172a'
                  }}>
                    {plan.name}
                  </div>

                  <div style={{ fontSize: 22, fontWeight: 700 }}>0€</div>

                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    30 días gratis · Después {plan.price}/mes
                  </div>

                  <ul style={{ paddingLeft: 16, fontSize: 13 }}>
                    <li>{plan.employees}</li>
                    <li>{plan.branches}</li>
                    <li>Fichaje y control horario</li>
                    <li>Impresión y exportación de informes</li>
                  </ul>

                  <div style={{ fontSize: 12 }}>
                    <strong>Timeo configura empleados y horarios por ti</strong> (gratis 30 días)
                  </div>

                  <div style={{
                    marginTop: 12,
                    marginLeft: 12,
                    paddingLeft: 12,
                    borderLeft: '2px solid #e2e8f0',
                  }}>
                    <label style={{ fontSize: 12 }}>
                      <input
                        type="checkbox"
                        checked={withManagement[plan.key]}
                        onChange={(e) => {
                          e.stopPropagation();
                          setWithManagement(prev => ({
                            ...prev,
                            [plan.key]: e.target.checked
                          }));
                        }}
                      />
                      {' '}Dejar que Timeo gestione tus horarios y empleados por ti
                    </label>

                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      +{plan.extraPrice}€/mes
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="dashboard-grid"
          style={{
            marginTop: 32,
            flexDirection: 'row',   // 🔥 CLAVE

          }}>
          <button onClick={() => navigate(-1)}>
            <X size={26} />
            <span>Cancelar</span>
          </button>

          <button onClick={handleSubmit}>
            <Check size={26} />
            <span>{loading ? 'Creando…' : 'Crear empresa'}</span>
          </button>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      alignItems: 'flex-start'
    }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const labelStyle = {
  fontSize: 15,
  fontWeight: 600,
  paddingLeft: 8,
  color: '#334155'
};

const inputStyle = {
  width: '85%',
  padding: 10,
  borderRadius: 10,
  border: '1px solid #cbd5e1',
};