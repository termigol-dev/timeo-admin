import React, { useEffect, useState } from 'react';
import { createUser, getBranches } from './api';

export default function CreateUser({ onCreated, defaultRole = 'EMPLEADO' }) {
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /* ───────── CARGA SUCURSALES ───────── */
  useEffect(() => {
    getBranches().then(setBranches);
  }, []);

  /* ───────── HANDLERS ───────── */
  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await createUser({
        ...form,
        password, // 🔑 CLAVE: ahora sí
      });

      setMessage('Usuario creado correctamente');

      // reset
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

      onCreated?.();
    } catch (err) {
      setError(err.message || 'Error creando usuario');
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow max-w-xl mx-auto mb-10"
    >
      <h2 className="text-xl font-bold mb-4">
        {form.role === 'EMPLEADO'
          ? 'Nuevo empleado'
          : 'Nuevo usuario'}
      </h2>

      {/* DATOS PERSONALES */}
      <div className="grid grid-cols-2 gap-4">
        <input
          name="name"
          placeholder="Nombre"
          value={form.name}
          onChange={change}
          required
        />
        <input
          name="firstSurname"
          placeholder="Primer apellido"
          value={form.firstSurname}
          onChange={change}
          required
        />
        <input
          name="secondSurname"
          placeholder="Segundo apellido (opcional)"
          value={form.secondSurname}
          onChange={change}
        />
        <input
          name="dni"
          placeholder="DNI"
          value={form.dni}
          onChange={change}
          required
        />
      </div>

      {/* EMAIL */}
      <input
        className="mt-4 w-full"
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={change}
        required
      />

      {/* CONTRASEÑA */}
      <input
        className="mt-4 w-full"
        type="password"
        placeholder="Contraseña inicial"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />

      {/* ROL + SUCURSAL */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <select name="role" value={form.role} onChange={change}>
          <option value="EMPLEADO">Empleado</option>
          <option value="ADMIN_SUCURSAL">Admin sucursal</option>
        </select>

        <select
          name="branchId"
          value={form.branchId}
          onChange={change}
          required
        >
          <option value="">Sucursal</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="mt-6 w-full py-3 rounded-lg bg-emerald-500 text-white font-semibold"
      >
        Crear usuario
      </button>

      {/* MENSAJES */}
      {message && (
        <div className="mt-4 text-emerald-600 font-medium">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 text-red-500 font-medium">
          {error}
        </div>
      )}
    </form>
  );
}