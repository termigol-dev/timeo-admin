import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { createEmployee, getBranches } from './api';

export default function CreateUser({ onCreated, defaultRole = 'EMPLEADO' }) {
  const { companyId } = useParams();

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

  // 🆕 foto (solo preview de momento)
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /* ───────── CARGA SUCURSALES ───────── */
  useEffect(() => {
    if (companyId) {
      getBranches(companyId).then(setBranches);
    }
  }, [companyId]);

  /* ───────── ROLES PERMITIDOS SEGÚN USUARIO LOGADO ───────── */
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

  /* ───────── HANDLERS ───────── */

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

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
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

      // 🔑 no enviar branchId vacío
      if (!payload.branchId) {
        delete payload.branchId;
      }

      // ⚠️ la foto todavía NO se envía al backend
      // la dejamos preparada en el estado

      const created = await createEmployee(companyId, payload);

      if (photoFile && created?.id) {
        const fd = new FormData();
        fd.append('file', photoFile);

        await fetch(
          `${import.meta.env.VITE_API_URL}/users/${created.id}/photo`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: fd,
          }
        );
      }
      
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
      setPhotoFile(null);
      setPhotoPreview(null);

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
      <h2 className="text-xl font-bold mb-6">
        Crear usuario
      </h2>

      {/* FOTO */}
      <div className="flex items-center gap-5 mb-6">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-slate-500 text-sm">Sin foto</span>
          )}
        </div>

        <label className="cursor-pointer text-sm font-medium text-emerald-600">
          Hacer o añadir foto
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onSelectPhoto}
          />
        </label>
      </div>

      {/* DATOS PERSONALES */}
      <div className="grid grid-cols-2 gap-4">
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
          <label className="text-sm block mb-1">Primer apellido</label>
          <input
            className="w-full"
            name="firstSurname"
            value={form.firstSurname}
            onChange={change}
            required
          />
        </div>

        <div>
          <label className="text-sm block mb-1">Segundo apellido</label>
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
      <div className="mt-4">
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

      {/* CONTRASEÑA */}
      <div className="mt-4">
        <label className="text-sm block mb-1">Contraseña inicial</label>
        <input
          className="w-full"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>

      {/* ROL + SUCURSAL */}
      <div className="grid grid-cols-2 gap-4 mt-4">

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
                {r === 'ADMIN_SUCURSAL' && 'Administrador de sucursal'}
                {r === 'ADMIN_EMPRESA' && 'Administrador de empresa'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm block mb-1">Sucursal</label>
          <select
            className="w-full"
            name="branchId"
            value={form.branchId}
            onChange={change}
            disabled={!needsBranch}
            required={needsBranch}
          >
            <option value="">
              {needsBranch ? 'Selecciona sucursal' : 'No aplica'}
            </option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
      >
        Crear usuario
      </button>

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