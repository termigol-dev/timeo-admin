import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        firstSurname: '',
        secondSurname: '',
        dni: '',
        email: '',
        password: '',
    });

    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    function change(e) {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    }

    function onSelectPhoto(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setPhotoPreview(reader.result);
            setPhotoFile(reader.result);
        };
        reader.readAsDataURL(file);
    }

    async function handleSubmit() {
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/auth/register`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...form,
                        photoUrl: photoFile,
                    }),
                }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Error al registrar');
            }

            const data = await res.json();

            // 🔥 NO GUARDAR TOKEN NI USER
            // 🔥 NO AUTOLOGIN

            navigate('/login');

        } catch (e) {
            console.error(e);
            setMessage(e.message || 'Error al crear la cuenta');
        } finally {
            setSaving(false);
        }
    }

    const initials =
        `${form.name?.[0] || ''}${form.firstSurname?.[0] || ''}`.toUpperCase();

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>

            {/* HEADER */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
            }}>
                <h2 style={{ margin: 0 }}>Crear cuenta</h2>

                <div className="tablet-actions">
                    <button onClick={() => navigate(-1)}>
                        ← Volver
                    </button>
                </div>
            </div>

            {/* CARD */}
            <div style={{
                background: '#f8fafc',
                borderRadius: 20,
                padding: 24,
                border: '1px solid #e2e8f0',
            }}>

                {/* 🔥 FORM */}
                <form autoComplete="off">

                    {/* 🔥 CAMPOS FANTASMA */}
                    <input type="text" name="fake-user" autoComplete="username" style={{ display: 'none' }} />
                    <input type="password" name="fake-pass" autoComplete="current-password" style={{ display: 'none' }} />

                    {/* FOTO */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 24,
                        gap: 16,
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: 20,
                            color: '#475569',
                        }}>
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                initials
                            )}
                        </div>

                        <div>
                            <div style={{ fontWeight: 600 }}>
                                {form.name} {form.firstSurname}
                            </div>

                            <label style={labelStyle}>Foto</label>
                            <div style={{ marginTop: 6 }}>
                                <label style={photoButtonStyle}>
                                    Cambiar
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={onSelectPhoto}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* GRID */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 20,
                    }}>

                        <Field label="Nombre">
                            <input name="name" value={form.name} onChange={change} style={inputStyle} />
                        </Field>

                        <Field label="Primer apellido">
                            <input name="firstSurname" value={form.firstSurname} onChange={change} style={inputStyle} />
                        </Field>

                        <Field label="Segundo apellido">
                            <input name="secondSurname" value={form.secondSurname} onChange={change} style={inputStyle} />
                        </Field>

                        <Field label="DNI">
                            <input name="dni" value={form.dni} onChange={change} style={inputStyle} />
                        </Field>

                        <Field label="Email">
                            <input
                                name="timeo-email"
                                value={form.email}
                                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                autoComplete="off"
                                style={inputStyle}
                            />
                        </Field>

                        <Field label="Contraseña">
                            <input
                                type="password"
                                name="timeo-password"
                                value={form.password}
                                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                                autoComplete="new-password"
                                style={inputStyle}
                            />
                        </Field>

                    </div>

                    {/* ACTION */}
                    <div className="tablet-actions" style={{ marginTop: 32 }}>
                        <button type="button" onClick={handleSubmit} disabled={saving}>
                            {saving ? 'Creando…' : 'Crear cuenta'}
                        </button>
                    </div>

                </form>

                {message && (
                    <p style={{ marginTop: 12, fontSize: 13 }}>
                        {message}
                    </p>
                )}

            </div>
        </div>
    );
}

/* COMPONENTE FIELD */
function Field({ label, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>{label}</label>
            {children}
        </div>
    );
}

const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
};

const inputStyle = {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
};

const photoButtonStyle = {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 12,
    cursor: 'pointer',
};