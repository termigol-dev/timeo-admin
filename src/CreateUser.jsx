import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createEmployee, getBranches } from './api';
import { QRCodeSVG } from 'qrcode.react';

export default function CreateUser({ onCreated, defaultRole = 'EMPLEADO' }) {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const rawUser = localStorage.getItem('user');
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  const [branches, setBranches] = useState([]);

  const [form, setForm] = useState({
    name: '',
    firstSurname: '',
    secondSurname: '',
    dni: '',
    email: '',
    role: defaultRole,
    branchId: '',
  });

  const [password, setPassword] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSchedulePrompt, setShowSchedulePrompt] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState(null);
  const [isFirstEmployee, setIsFirstEmployee] = useState(false);

  // reutilizamos tu lógica de tablet
  const [tabletInfo, setTabletInfo] = useState(null);
  const btnStyle = {
    marginTop: 10,
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    background: '#00a0a8',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 600
  };
  /* ───────── CARGA SUCURSALES ───────── */
  useEffect(() => {
    if (!companyId) return;

    loadBranches();
  }, [companyId]);

  async function loadBranches(retries = 3) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/public/companies/${companyId}/branches`
      );

      if (!res.ok) {
        throw new Error('Error cargando sucursales');
      }

      const b = await res.json();
      setBranches(b || []);

    } catch (err) {
      if (retries > 0) {
        setTimeout(() => loadBranches(retries - 1), 300);
      } else {
        console.error('❌ No se pudieron cargar sucursales', err);
      }
    }
  }

  /* ───────── ROLES PERMITIDOS ───────── */
  const allowedRoles = useMemo(() => {
    if (!currentUser) return [];

    switch (currentUser.role) {
      case 'SUPERADMIN':
        return ['ADMIN_EMPRESA', 'ADMIN_SUCURSAL', 'EMPLEADO'];
      case 'ADMIN_EMPRESA':
        return ['ADMIN_EMPRESA', 'ADMIN_SUCURSAL', 'EMPLEADO'];
      case 'ADMIN_SUCURSAL':
        return ['EMPLEADO'];
      default:
        return [];
    }
  }, [currentUser]);

  const needsBranch =
    form.role === 'EMPLEADO' || form.role === 'ADMIN_SUCURSAL';

  function change(e) {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'role' && value === 'ADMIN_EMPRESA'
        ? { branchId: '' }
        : {}),
    }));
  }

  function onSelectPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setPhotoFile(reader.result); // ← base64 igual que Profile
    };
    reader.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const payload = {
        ...form,
        password,
      };

      if (!payload.branchId) delete payload.branchId;

      console.log('🚀 PAYLOAD:', payload);

      const res = await createEmployee(companyId, payload);

      const created = res.employee || res;

      console.log('✅ CREATED:', created);

      // 🔥 FIX IMPORTANTE
      const branchId = created?.branchId || form.branchId;

      console.log('🏢 BRANCH ID FINAL:', branchId);

      // 🔥 GENERAR TOKEN TABLET (USANDO TU FORMATO REAL)
      let tablet = null;

      if (branchId) {
        try {
          const tokenRes = await fetch(
            `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${branchId}/tablet-token`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );

          if (!tokenRes.ok) {
            throw new Error('Error generando token tablet');
          }

          const data = await tokenRes.json();

          console.log('🔑 TOKEN RESPONSE:', data);

          tablet = {
            branchName:
              branches.find(b => b.id === branchId)?.name || '',
            token: data.tabletToken, // 🔥 IGUAL QUE EN BRANCHES
          };

          console.log('📲 TABLET INFO:', tablet);

          setTabletInfo(tablet);

        } catch (err) {
          console.error('❌ Error generando QR tablet', err);
        }
      } else {
        console.warn('⚠️ NO HAY BRANCH ID → no se genera QR tablet');
      }

      setCreatedEmployee(created);
      setIsFirstEmployee(res.isFirstEmployee || false);

      // 👉 ABRIMOS MODAL
      setShowSuccessModal(true);

      // 🔑 esperar backend
      await new Promise(r => setTimeout(r, 300));

      if (photoFile && created?.id) {
        const resPhoto = await fetch(
          `${import.meta.env.VITE_API_URL}/users/${created.id}/photo`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              photoUrl: photoFile,
            }),
          }
        );

        if (!resPhoto.ok) throw new Error('Error subiendo foto');
      }

      setForm({
        name: '',
        firstSurname: '',
        secondSurname: '',
        dni: '',
        email: '',
        role: defaultRole,
        branchId: '',
      });

      setPassword('');
      setPhotoFile(null);
      setPhotoPreview(null);

    } catch (err) {
      console.error('❌ ERROR SUBMIT:', err);
      setError(err.message || 'Error creando usuario');
    } finally {
      setSaving(false);
    }
  }

  {
    {
      showSuccessModal && createdEmployee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>

          <div style={{
            background: 'white',
            padding: 28,
            borderRadius: 14,
            width: 560,
            maxWidth: '90%',
            boxShadow: '0 15px 40px rgba(0,0,0,0.25)'
          }}>

            {/* 🎉 SOLO PRIMER EMPLEADO */}
            {isFirstEmployee && (
              <h3 style={{ marginBottom: 10 }}>
                🎉 ¡Ya tienes tu primer empleado!
              </h3>
            )}

            <p style={{
              pading: 12,
              whiteSpace: 'pre-line',
              lineHeight: 1.5,
              fontSize: 14,
              color: '#334155'
            }}>
              {`Tu empleado ya está listo para empezar a utilizar Timeo.

Para fichar desde su móvil, escanea este QR o envíaselo por email. Podrá iniciar sesión con su email y la contraseña que hayas definido.

También puede fichar desde una tablet en tu local o desde un ordenador utilizando el segundo QR.`}
            </p>

            {/* QRs */}
            <div style={{
              display: 'flex',
              gap: 80,
              marginTop: 24,
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>

              {/* 📱 EMPLEADO */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>
                  Acceso móvil
                </p>

                <QRCodeSVG
                  value="https://timeo-mobile.onrender.com/"
                  size={140}
                />

                <button
                  onClick={async () => {
                    try {
                      await fetch(
                        `${import.meta.env.VITE_API_URL}/users/${createdEmployee.id}/send-invite`,
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            password: password, // 👈 ESTA ES LA CLAVE
                          }),
                        }
                      );

                      alert('📩 Email enviado');
                    } catch (err) {
                      console.error(err);
                      alert('❌ Error enviando email');
                    }
                  }}
                >
                  📩 Enviar email
                </button>
              </div>

              {/* 🖥️ TABLET */}
              {tabletInfo && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 600, marginBottom: 8 }}>
                    Tablet / ordenador
                  </p>

                  <QRCodeSVG
                    value={`https://timeo-tablet.onrender.com?token=${tabletInfo.token}`}
                    size={140}
                  />

                  <button
                    style={btnStyle}
                    onClick={() => alert('Enviar email tablet')}
                  >
                    Enviar email
                  </button>
                </div>
              )}

            </div>

            {/* CONTINUAR */}
            <button
              style={{
                marginTop: 28,
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: '#00a0a8',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 15
              }}
              onClick={() => {
                setShowSuccessModal(false);
                setShowSchedulePrompt(true);
              }}
            >
              Continuar
            </button>

          </div>
        </div>
      )
    }
  }

  {

  }

  return (
    <div className="container" style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* ✅ MODAL 1 */}
      {showSuccessModal && createdEmployee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="card center" style={{ maxWidth: 520 }}>
            <div>

              {/* 🎉 SOLO PRIMER EMPLEADO */}
              {isFirstEmployee && (
                <h3 style={{ marginBottom: 12 }}>
                  🎉 ¡Ya tienes tu primer empleado!
                </h3>
              )}

              <p style={{ whiteSpace: 'pre-line' }}>
                {`Tu empleado ya está listo para empezar a utilizar Timeo.

Para que pueda fichar desde su móvil, enséñale este QR o pulsa sobre él para enviárselo por email. Podrá acceder desde su dispositivo, iniciar sesión con su email y la contraseña que hayas definido.

También puede fichar desde una tablet en tu local o desde un ordenador.`}
              </p>

              {/* QRs */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 40,
                  marginTop: 24,
                  flexWrap: 'wrap',
                }}
              >

                {/* 📱 QR EMPLEADO */}
                <div style={{ textAlign: 'center' }}>
                  <button onClick={() => alert('Enviar email empleado')}>
                    📩 Enviar email
                  </button>

                  <div style={{ marginTop: 10 }}>
                    <QRCodeSVG
                      value="https://timeo-frontend.onrender.com/mobile"
                      size={160}
                    />
                  </div>

                  <div style={{ fontSize: 12, marginTop: 6 }}>
                    Acceso móvil
                  </div>
                </div>

                {/* 🖥️ QR TABLET */}
                {tabletInfo && (
                  <div style={{ textAlign: 'center' }}>
                    <button onClick={() => alert('Enviar email tablet')}>
                      📩 Enviar email
                    </button>

                    <div style={{ marginTop: 10 }}>
                      <QRCodeSVG
                        value={`https://timeo-tablet.onrender.com?token=${tabletInfo.token}`}
                        size={160}
                      />
                    </div>

                    <div style={{ fontSize: 12, marginTop: 6 }}>
                      Tablet / ordenador
                    </div>
                  </div>
                )}

              </div>

            </div>
            <button onClick={() => {
              setShowSuccessModal(false);
              setShowSchedulePrompt(true);
            }}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* ✅ MODAL 2 */}
      {showSchedulePrompt && createdEmployee && (
        <div className="modal">
          <div className="card center" style={{ maxWidth: 420 }}>

            <p>
              Tu empleado ya está listo para utilizar Timeo.
              <br /><br />
              ¿Quieres crear un horario ahora?
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => navigate('/admin')}>
                No
              </button>

              <button
                onClick={() =>
                  navigate(`/admin/employees/${createdEmployee.id}/schedules`)
                }
              >
                Sí (recomendado)
              </button>
            </div>

          </div>
        </div>
      )}
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h2>Nuevo usuario</h2>

        <div className="tablet-actions">
          <button type="button" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={submit}>
          {/* FOTO */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                color: '#475569',
                flexShrink: 0,
              }}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span style={{ fontSize: 12 }}>Sin foto</span>
              )}
            </div>

            <label
              style={{
                cursor: 'pointer',
                fontWeight: 600,
                color: 'rgb(0,160,168)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              ➕ Añadir foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={onSelectPhoto}
              />
            </label>
          </div>

          {/* DATOS PERSONALES */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <div>
              <label className="text-sm block mb-1">Nombre</label>
              <input
                className="w-full"
                name="name"
                value={form.name}
                onChange={change}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">
                Primer apellido
              </label>
              <input
                className="w-full"
                name="firstSurname"
                value={form.firstSurname}
                onChange={change}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">
                Segundo apellido
              </label>
              <input
                className="w-full"
                name="secondSurname"
                value={form.secondSurname}
                onChange={change}
              />
            </div>

            <div>
              <label className="text-sm block mb-1">DNI</label>
              <input
                className="w-full"
                name="dni"
                value={form.dni}
                onChange={change}
                required
              />
            </div>
          </div>

          {/* EMAIL */}
          <div style={{ marginTop: 16 }}>
            <label className="text-sm block mb-1">Email</label>
            <input
              className="w-full"
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              required
            />
          </div>

          {/* PASSWORD */}
          <div style={{ marginTop: 16 }}>
            <label className="text-sm block mb-1">
              Contraseña inicial
            </label>
            <input
              className="w-full"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {/* ROL + SUCURSAL */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginTop: 16,
            }}
          >
            <div>
              <label className="text-sm block mb-1">Rol</label>
              <select
                className="w-full"
                name="role"
                value={form.role}
                onChange={change}
              >
                {allowedRoles.map(r => (
                  <option key={r} value={r}>
                    {r === 'EMPLEADO' && 'Empleado'}
                    {r === 'ADMIN_SUCURSAL' &&
                      'Administrador de sucursal'}
                    {r === 'ADMIN_EMPRESA' &&
                      'Administrador de empresa'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">
                Sucursal
              </label>
              <select
                className="w-full"
                name="branchId"
                value={form.branchId}
                onChange={change}
                disabled={!needsBranch}
                required={needsBranch}
              >
                <option value="">
                  {needsBranch
                    ? 'Selecciona sucursal'
                    : 'No aplica'}
                </option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ACCIONES */}
          <div
            className="tablet-actions"
            style={{ marginTop: 28 }}
          >
            <button type="submit" disabled={saving}>
              Crear usuario
            </button>
          </div>

          {message && (
            <div
              style={{
                marginTop: 16,
                color: '#059669',
                fontWeight: 600,
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: 16,
                color: '#ef4444',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}