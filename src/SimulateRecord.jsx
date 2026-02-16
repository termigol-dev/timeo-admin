import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SimulateRecord() {

    const [employees, setEmployees] = useState([]);
    const [userId, setUserId] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [branchId, setBranchId] = useState('');

    const [date, setDate] = useState('');
    const [inTime, setInTime] = useState('');
    const [outTime, setOutTime] = useState('');

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadEmployees();
    }, []);

    async function loadEmployees() {
        try {
            const res = await axios.get('http://localhost:3000/users', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            console.log("USERS RESPONSE:", res.data);
            setEmployees(Array.isArray(res.data) ? res.data : res.data.users || []);
        } catch (err) {
            console.error(err);
        }
    }

    async function simulate() {
        if (!userId || !date) {
            alert('Selecciona empleado y fecha');
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post('http://localhost:3000/admin/dev/simulate', {
                userId,
                companyId,
                branchId,
                date,
                inTime: inTime || null,
                outTime: outTime || null,
            });

            setResult(res.data);
        } catch (err) {
            console.error(err);
            alert('Error simulando');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

            <h2>Simular fichaje (modo debug)</h2>

            <div style={{ display: 'grid', gap: 12 }}>

                <select
                    value={userId}
                    onChange={e => {
                        const emp = employees.find(x => x.id === e.target.value);
                        setUserId(emp?.id || '');
                        setCompanyId(emp?.companyId || '');
                        setBranchId(emp?.branchId || '');
                    }}
                >
                    <option value="">Selecciona empleado</option>
                    {employees.map(e => (
                        <option key={e.id} value={e.id}>
                            {e.name} {e.lastName}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />

                <input
                    type="time"
                    value={inTime}
                    onChange={e => setInTime(e.target.value)}
                    placeholder="Hora IN"
                />

                <input
                    type="time"
                    value={outTime}
                    onChange={e => setOutTime(e.target.value)}
                    placeholder="Hora OUT"
                />

                <button onClick={simulate} disabled={loading}>
                    {loading ? 'Simulando...' : 'Simular'}
                </button>
            </div>

            {result && (
                <div style={{ marginTop: 30 }}>

                    <h3>Resultado</h3>

                    <pre
                        style={{
                            background: '#111',
                            color: '#0f0',
                            padding: 16,
                            borderRadius: 8,
                            overflow: 'auto',
                            fontSize: 12,
                        }}
                    >
                        {JSON.stringify(result, null, 2)}
                    </pre>

                </div>
            )}

        </div>
    );
}