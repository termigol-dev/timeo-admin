import React, { useEffect, useState } from 'react';
import { createUser, getBranches } from './api';

export default function CreateUser({ onCreated }) {
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

  useEffect(() => {
    getBranches().then(setBranches);
  }, []);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    await createUser(form);
    alert('Empleado creado');
    onCreated?.();
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow max-w-xl mx-auto mb-10"
    >
      <h2 className="text-xl font-bold mb-4">Nuevo empleado</h2>

      <div className="grid grid-cols-2 gap-4">
        <input name="name" placeholder="Nombre" onChange={change} required />
        <input name="firstSurname" placeholder="Primer apellido" onChange={change} required />
        <input name="secondSurname" placeholder="Segundo apellido (opcional)" onChange={change} />
        <input name="dni" placeholder="DNI" onChange={change} required />
      </div>

      <input
        className="mt-4 w-full"
        name="email"
        placeholder="Email"
        onChange={change}
        required
      />

      <div className="grid grid-cols-2 gap-4 mt-4">
        <select name="role" onChange={change}>
          <option value="EMPLEADO">Empleado</option>
          <option value="ADMIN_SUCURSAL">Admin sucursal</option>
        </select>

        <select name="branchId" onChange={change} required>
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
        Crear empleado
      </button>
    </form>
  );
}
