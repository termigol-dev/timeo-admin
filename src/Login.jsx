import React, { useState } from 'react';
import Logo from "./components/Logo";

export default function Login({ dark, setDark, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!res.ok) {
        throw new Error('Email o contraseña incorrectos');
      }

      const data = await res.json();

      // 🔐 guardar sesión
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));

      onLogin();

    } catch (err) {
      console.error('❌ LOGIN ERROR', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 32
        }}>
          <Logo dark={dark} size={120} />
        </div>

        <div className="subtitle">Panel de administración</div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email administrador"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
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