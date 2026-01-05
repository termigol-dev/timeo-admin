import React, { useEffect, useState } from 'react';
import { getMyReports } from './api';

export default function Reports() {
  const [days, setDays] = useState([]);
  const [totalHours, setTotalHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDays, setOpenDays] = useState({});

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  async function load(filters = {}) {
    setLoading(true);
    try {
      const res = await getMyReports(filters);

      setDays(res.days || []);
      setTotalHours(
        typeof res.totalHours === 'number' ? res.totalHours : null
      );

      // Abrir todos los días por defecto
      const open = {};
      (res.days || []).forEach(d => {
        open[d.date] = true;
      });
      setOpenDays(open);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    load({
      from: from || undefined,
      to: to || undefined,
    });
  }

  function toggleDay(date) {
    setOpenDays(d => ({ ...d, [date]: !d[date] }));
  }

  if (loading) {
    return <div className="center">Cargando informes…</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>Informes</h2>
      </div>

      {/* ───────── FILTROS ───────── */}
      <div className="form">
        <input
          type="date"
          value={from}
          onChange={e => setFrom(e.target.value)}
        />
        <input
          type="date"
          value={to}
          onChange={e => setTo(e.target.value)}
        />
        <button className="btn" onClick={applyFilters}>
          Filtrar
        </button>
      </div>

      {/* ───────── TOTAL HORAS (solo si backend lo envía) ───────── */}
      {totalHours !== null && (
        <div className="card" style={{ marginBottom: 20 }}>
          <strong>Total horas:</strong> {totalHours} h
        </div>
      )}

      {days.length === 0 && (
        <div className="center">No hay registros</div>
      )}

      {/* ───────── DÍAS ───────── */}
      {days.map((day, idx) => (
        <div key={idx} className="card" style={{ marginBottom: 16 }}>
          {/* CABECERA DÍA (ACORDEÓN) */}
          <div
            onClick={() => toggleDay(day.date)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 10,
              cursor: 'pointer',
            }}
          >
            <strong>{day.date}</strong>

            {day.totalHours !== undefined && (
              <span>{day.totalHours} h</span>
            )}
          </div>

          {/* CONTENIDO */}
          {openDays[day.date] && (
            <table className="table">
              <thead>
                <tr>
                  <th>Entrada</th>
                  <th>Salida</th>
                </tr>
              </thead>
              <tbody>
                {day.sessions.map((s, i) => (
                  <tr key={i}>
                    <td style={{ color: '#22c55e', fontWeight: 600 }}>
                      {new Date(s.in).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ color: '#ef4444', fontWeight: 600 }}>
                      {new Date(s.out).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}