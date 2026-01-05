import React, { useState } from 'react';
import { adminLogin } from './api';

export default function Login({ dark, setDark, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 🔑 1. LLAMADA REAL AL BACKEND
      const res = await adminLogin(email, password);
      onLogin()

      console.log('LOGIN RESPONSE 👉', res);

      // 🔑 2. GUARDAR TOKEN
      setToken(res.token);

      // 🔑 3. GUARDAR USUARIO
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: res.user.id,
          role: res.user.role,
          companyId: res.user.companyId,
          branchId: res.user.branchId,
        })
      );

      // 🔑 4. ENTRAR AL ADMIN
      onLogin();
    } catch (e) {
      console.error(e);
      setError('Credenciales incorrectas');
    } finally {
      setLoading(false);
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