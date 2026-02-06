import React, { useEffect, useState } from 'react';
import { getMyDailyReport } from './api';

function minutesToPercent(min) {
  return (min / 1440) * 100;
}

export default function Reports() {

  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  // de momento fijo para probar
  const from = '2026-02-01';
  const to = '2026-02-05';

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await getMyDailyReport({ from, to });
      setDays(res.days || []);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="center">Cargando informe…</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2>Informe diario</h2>

      {days.map(day => (
        <div
          key={day.date}
          style={{
            border: '1px solid #ddd',
            borderRadius: 6,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <strong>{day.date}</strong>

          {/* SHIFTS (línea azul) */}
          <div style={{ marginTop: 12 }}>
            <div><b>Horario previsto</b></div>

            <div
              style={{
                position: 'relative',
                height: 14,
                background: '#f1f5f9',
                borderRadius: 4,
                marginTop: 6,
              }}
            >
              {day.shifts.map(s => {

                const [sh, sm] = s.startTime.split(':').map(Number);
                const [eh, em] = s.endTime.split(':').map(Number);

                const startMin = sh * 60 + sm;
                const endMin = eh * 60 + em;

                return (
                  <div
                    key={s.id}
                    style={{
                      position: 'absolute',
                      left: `${minutesToPercent(startMin)}%`,
                      width: `${minutesToPercent(endMin - startMin)}%`,
                      top: 0,
                      bottom: 0,
                      background: '#2563eb',
                      borderRadius: 4,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* RECORDS */}
          <div style={{ marginTop: 8 }}>
            <div><b>Registros</b></div>
            {day.records.length === 0 && <div>—</div>}
            {day.records.map(r => (
              <div key={r.id}>
                {r.type} – {new Date(r.createdAt).toLocaleTimeString()}
              </div>
            ))}
          </div>

          {/* INCIDENTS */}
          <div style={{ marginTop: 8 }}>
            <div><b>Incidencias</b></div>
            {day.incidents.length === 0 && <div>—</div>}
            {day.incidents.map(i => (
              <div key={i.id}>
                {i.type} {i.note ? `- ${i.note}` : ''}
              </div>
            ))}
          </div>

        </div>
      ))}
    </div>
  );
}