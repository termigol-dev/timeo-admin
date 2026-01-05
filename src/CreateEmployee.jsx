import React, { useState, useEffect } from 'react';
import { createUser, getBranches } from './api';

export default function CreateEmployee({ dark }) {
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    name: '',
    firstSurname: '',
    secondSurname: '',
    dni: '',
    email: '',
    role: 'EMPLEADO',
    branchId: '',
  });

  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getBranches().then(setBranches);
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await createUser(form);
      setPassword(res.password);
      setMessage('Empleado creado correctamente');
      setForm({
        name: '',
        firstSurname: '',
        secondSurname: '',
        dni: '',
        email: '',
        role: 'EMPLEADO',
        branchId: '',
      });
    } catch {
      setError('Error creando empleado');
    }
  }

  return (
    <div className="page">
      <h2 className="page-title">Alta de empleado</h2>

      <form onSubmit={submit} className={`form ${dark ? 'dark' : ''}`}>
        <input name="name" placeholder="Nombre" value={form.name} onChange={handleChange} required />
        <input name="firstSurname" placeholder="Primer apellido" value={form.firstSurname} onChange={handleChange} required />
        <input name="secondSurname" placeholder="Segundo apellido (opcional)" value={form.secondSurname} onChange={handleChange} />
        <input name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />

        <select name="role" value={form.role} onChange={handleChange}>
          <option value="EMPLEADO">Empleado</option>
          <option value="ADMIN_SUCURSAL">Admin sucursal</option>
        </select>

        <select name="branchId" value={form.branchId} onChange={handleChange}>
          <option value="">Sin sucursal</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <button className="btn primary">Crear empleado</button>
      </form>

      {message && <div className="success-box">{message}</div>}
      {password && (
        <div className="info-box">
          Contraseña inicial: <b>{password}</b>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
}