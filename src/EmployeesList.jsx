import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAllEmployees,
} from './api';
import { useAuth } from './auth/AuthContext';

export default function EmployeesList() {
    /* ───────── AUTH ───────── */
    const { user } = useAuth();

    const isSuperAdmin = user?.role === 'SUPERADMIN';

    /* ───────── ROUTER ───────── */
    const navigate = useNavigate();

    /* ───────── STATE ───────── */
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    /* ───────── LOAD ───────── */
    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, []);

    async function load() {
        setLoading(true);
        try {
            const e = await getAllEmployees();
            setEmployees(e || []);
        } finally {
            setLoading(false);
        }
    }

    /* ───────── FILTERS ───────── */
    const visibleEmployees = isSuperAdmin
        ? employees
        : employees.filter(e => e.active);

    const filtered = visibleEmployees.filter(e =>
        `${e.name} ${e.firstSurname || ''} ${e.dni || ''} ${e.email || ''}`
            .toLowerCase()
            .includes(query.toLowerCase()),
    );

    /* ───────── RENDER ───────── */
    if (loading) {
        return <div className="center">Cargando empleados…</div>;
    }

    return (
        <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: 24 }}>
                <h2>Empleados</h2>

                <div className="tablet-actions">
                    <button onClick={() => navigate(-1)}>← Volver</button>
                </div>
            </div>

            <input
                className="search"
                placeholder="Buscar empleado…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ marginBottom: 24 }}
            />

            <table className="table" style={{ width: '100%' }}>
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>DNI</th>
                        <th>Sucursal</th>
                        <th>Activo</th>
                        <th className="right">Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {filtered.map(e => {

                        const initials =
                            `${e.name?.[0] || ''}${e.firstSurname?.[0] || ''}`.toUpperCase();

                        return (
                            <tr
                                key={e.id}
                                style={{
                                    opacity: isSuperAdmin && !e.active ? 0.5 : 1,
                                }}
                            >
                                {/* ───────── EMPLEADO (FOTO + NOMBRE) ───────── */}
                                <td>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                background: '#e5e7eb',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 600,
                                                fontSize: 13,
                                                color: '#475569',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {e.photo ? (
                                                <img
                                                    src={e.photo}
                                                    alt=""
                                                    loading="lazy"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            ) : (
                                                initials
                                            )}
                                        </div>

                                        <strong>
                                            {e.name} {e.firstSurname || ''}
                                        </strong>
                                    </div>
                                </td>

                                <td>{e.dni}</td>

                                {/* ───────── SUCURSAL (SOLO TEXTO) ───────── */}
                                <td>
                                    {e.branch?.name || '—'}
                                </td>

                                <td>{e.active ? 'Sí' : 'No'}</td>

                                <td className="right">
                                    <div className="tablet-actions">
                                        <button
                                            onClick={() => navigate(`/admin/users/${e.id}/profile`)}
                                        >
                                            Perfil
                                        </button>

                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/admin/companies/${e.companyId}/employees/${e.id}/schedules`
                                                )
                                            }
                                        >
                                            Horarios
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}

                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan="5" className="center muted">
                                No hay empleados registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}