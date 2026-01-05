import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createEmployee, getBranches } from './api';

export default function CreateUser({ onCreated, defaultRole = 'EMPLEADO' }) {
  const { companyId } = useParams(); // ✅ empresa desde la URL

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

  /* ───────── CARGA SUCURSALES (DE LA EMPRESA ACTUAL) ───────── */
  useEffect(() => {
    if (companyId) {
      getBranches(companyId).then(setBranches);
    }
  }, [companyId]);

  /* ───────── HANDLERS ───────── */
  function change(e) {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
      // si cambia a ADMIN_EMPRESA, quitamos sucursal
      ...(name === 'role' && value === 'ADMIN_EMPRESA'
        ? { branchId: '' }
        : {}),
    }));
  }

  async function submit(e) {
  e.preventDefault();
  setError('');
  setMessage('');

  try {
    const payload = {
      ...form,
      password,
    };

    // 🔑 CLAVE: no enviar branchId vacío
    if (!payload.branchId) {
      delete payload.branchId;
    }

    await createEmployee(companyId, payload); // ✅ companyId correcto

    setMessage('Usuario creado correctamente');

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

  const needsBranch =
    form.role === 'EMPLEADO' || form.role === 'ADMIN_SUCURSAL';

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
          <option value="ADMIN_EMPRESA">Admin empresa</option>
        </select>

        <select
          name="branchId"
          value={form.branchId}
          onChange={change}
          disabled={!needsBranch}
          required={needsBranch}
        >
          <option value="">
            {needsBranch ? 'Sucursal' : 'No aplica'}
          </option>
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