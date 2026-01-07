import React, { useState } from 'react';
import { adminLogin } from './api';

export default function Login({ dark, setDark, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
  e.preventDefault();

  console.log('🚀 LOGIN SUBMIT', email);

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );

    console.log('📡 STATUS:', res.status);

    const text = await res.text();
    console.log('📦 RAW RESPONSE:', text);

    if (!res.ok) {
      throw new Error('Login incorrecto');
    }

    const data = JSON.parse(text);

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    onLogin();
  } catch (err) {
    console.error('❌ LOGIN ERROR', err);
  }
}

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo">
          t<span>i</span>meo
        </div>

        <div className="subtitle">Panel de administración</div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email administrador"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && <div className="error">{error}</div>}

          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'ENTRAR'}
          </button>
        </form>

        <label className="dark-toggle">
          <input
            type="checkbox"
            checked={dark}
            onChange={() => setDark(d => !d)}
          />
          <span>Modo oscuro</span>
        </label>

        <footer className="login-footer">© timeo</footer>
      </div>
    </div>
  );
}