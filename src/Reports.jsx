import React, { useEffect, useState, useMemo } from 'react';
import { getMyDailyReport } from './api';
import { useParams } from 'react-router-dom';

/* ---------------- helpers ---------------- */

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToPercent(min) {
  return (min / 1440) * 100;
}

// devuelve el lunes de la semana (lunes=1 ... domingo=7)
function isoWeekStart(dateStr) {
  const base = new Date(dateStr + 'T12:00:00');

  const jsDay = base.getDay(); // 0..6 (dom..sab)
  const day = jsDay === 0 ? 7 : jsDay; // 1..7 (lun..dom)

  const diff = day - 1;

  const monday = new Date(base);
  monday.setDate(base.getDate() - diff);
  monday.setHours(0, 0, 0, 0);

  return monday;
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function weekdayName(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  return date.toLocaleDateString('es-ES', { weekday: 'long' });
}

function hourLabel(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/* ------------------------------------------------ */

export default function Reports() {

  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(1); // 0..11

  const [currentWeek, setCurrentWeek] = useState(0);
  const { userId } = useParams();
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [year, month]);

  async function load() {
    setLoading(true);
    try {
      const res = await getMyDailyReport({  userId, from, to });
      setDays(res.days || []);
      setCurrentWeek(0);
    } finally {
      setLoading(false);
    }
  }

  /*
    weeks = [{ weekStart: Date, daysMap: Map<date,day> }]
    SIEMPRE semanas completas (lunes → domingo)
  */
  const weeks = useMemo(() => {

    const mapByDate = new Map();
    for (const d of days) {
      mapByDate.set(d.date, d);
    }

    const firstMonday = isoWeekStart(from);
    const lastMonday = isoWeekStart(to);

    const result = [];

    let cursor = new Date(firstMonday);

    while (cursor <= lastMonday) {

      const daysMap = new Map();

      for (let i = 0; i < 7; i++) {
        const d = addDays(cursor, i);
        const key = toISODate(d);
        if (mapByDate.has(key)) {
          daysMap.set(key, mapByDate.get(key));
        }
      }

      result.push({
        weekStart: new Date(cursor),
        daysMap,
      });

      cursor = addDays(cursor, 7);
    }

    return result;

  }, [days, from, to]);

  if (loading) {
    return <div className="center">Cargando informe…</div>;
  }

  const week = weeks[currentWeek];

  return (
    <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>

      <h2>Informes</h2>

      {/* selector mes / año */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>

        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
        >
          {[
            'Enero','Febrero','Marzo','Abril','Mayo','Junio',
            'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
          ].map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>

        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
        >
          {[2024,2025,2026,2027,2028].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

      </div>

      {/* navegación semanas */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>

        <button
          disabled={currentWeek === 0}
          onClick={() => setCurrentWeek(w => w - 1)}
        >
          ◀ Semana anterior
        </button>

        <div style={{ fontSize: 13 }}>
          Semana {weeks.length ? currentWeek + 1 : 0} de {weeks.length}
        </div>

        <button
          disabled={currentWeek >= weeks.length - 1}
          onClick={() => setCurrentWeek(w => w + 1)}
        >
          Semana siguiente ▶
        </button>

      </div>

      {!week && <div>No hay datos</div>}

      {week && (

        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
          }}
        >

          <div style={{ fontWeight: 600, marginBottom: 12 }}>
            Semana desde {toISODate(week.weekStart)}
          </div>

          {/* -------- SIEMPRE 7 DÍAS (LUNES → DOMINGO) -------- */}
          {Array.from({ length: 7 }).map((_, idx) => {

            const d = addDays(week.weekStart, idx);
            const dateStr = toISODate(d);

            const dayData = week.daysMap.get(dateStr);

            const isSameMonth = d.getMonth() === month;

            const dayLabel = weekdayName(dateStr);

            const shifts = dayData?.shifts || [];
            const records = dayData?.records || [];
            const incidents = dayData?.incidents || [];

            return (
              <div
                key={dateStr}
                style={{
                  marginBottom: 18,
                  opacity: isSameMonth ? 1 : 0.35,
                }}
              >

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {dayLabel}
                  </div>
                  <div style={{ fontSize: 13, color: '#555' }}>
                    {dateStr}
                  </div>
                </div>

                <div
                  style={{
                    position: 'relative',
                    height: 48,
                    marginTop: 6,
                    borderTop: '1px solid #bbb',
                    borderBottom: '1px solid #bbb',
                    background: '#fff',
                  }}
                >

                  {/* rejilla horas */}
                  {Array.from({ length: 25 }).map((_, h) => {

                    const isMain = h % 4 === 0;

                    return (
                      <div
                        key={h}
                        style={{
                          position: 'absolute',
                          left: `${(h / 24) * 100}%`,
                          bottom: 0,
                          height: '100%',
                          width: 1,
                          background: '#000',
                          opacity: isMain ? 0.35 : 0.12,
                        }}
                      >
                        {isMain && h < 24 && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 2,
                              transform: 'rotate(-90deg)',
                              transformOrigin: 'left bottom',
                              fontSize: 9,
                              whiteSpace: 'nowrap',
                              color: '#000',
                            }}
                          >
                            {hourLabel(h)}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* horario previsto */}
                  {shifts.map(s => {

                    const start = timeToMinutes(s.startTime);
                    const end = timeToMinutes(s.endTime);

                    return (
                      <div
                        key={s.id}
                        style={{
                          position: 'absolute',
                          bottom: 24,
                          height: 10,
                          left: `${minutesToPercent(start)}%`,
                          width: `${minutesToPercent(end - start)}%`,
                          background: '#2563eb',
                          borderRadius: 3,
                        }}
                      />
                    );
                  })}

                  {/* trabajado */}
                  {(() => {

                    const blocks = [];

                    for (let i = 0; i < records.length - 1; i++) {

                      const a = records[i];
                      const b = records[i + 1];

                      if (a.type !== 'IN' || b.type !== 'OUT') continue;

                      const sa = new Date(a.createdAt);
                      const sb = new Date(b.createdAt);

                      const startMin = sa.getHours() * 60 + sa.getMinutes();
                      const endMin = sb.getHours() * 60 + sb.getMinutes();

                      blocks.push(
                        <div
                          key={a.id}
                          style={{
                            position: 'absolute',
                            bottom: 10,
                            height: 10,
                            left: `${minutesToPercent(startMin)}%`,
                            width: `${minutesToPercent(endMin - startMin)}%`,
                            background: '#22c55e',
                            borderRadius: 3,
                          }}
                        />,
                      );
                    }

                    return blocks;
                  })()}

                  {/* incidencias */}
                  {incidents.map(i => {

                    const t = new Date(i.occurredAt || i.createdAt);
                    const min = t.getHours() * 60 + t.getMinutes();

                    let color = '#eab308';

                    if (i.type === 'NO_SHOW') color = '#dc2626';
                    else if (
                      i.type === 'IN_LATE' ||
                      i.type === 'OUT_EARLY'
                    ) color = '#f97316';

                    return (
                      <div
                        key={i.id}
                        style={{
                          position: 'absolute',
                          left: `${minutesToPercent(min)}%`,
                          bottom: 36,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: color,
                          }}
                        />
                        <div
                          style={{
                            fontSize: 9,
                            color: '#000',
                            transform: 'rotate(-90deg)',
                            transformOrigin: 'left bottom',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {i.type}
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* leyenda */}

      <div style={{ marginTop: 16, fontSize: 13 }}>

        <b>Leyenda</b>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
            marginTop: 8,
          }}
        >

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 18, height: 10, background: '#2563eb', borderRadius: 3 }} />
              <span>Horario previsto</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <div style={{ width: 18, height: 10, background: '#22c55e', borderRadius: 3 }} />
              <span>Horario trabajado</span>
            </div>
          </div>

          <div>
            <div>🟨 IN_EARLY, OUT_LATE → tiempo extra</div>
            <div style={{ marginTop: 4 }}>
              🟨 FORGOT_IN, FORGOT_OUT → olvido en el registro
            </div>
          </div>

          <div>
            <div>🟧 IN_LATE, OUT_EARLY → ingreso tarde y salida temprana</div>
            <div style={{ marginTop: 4 }}>
              🟥 NO_SHOW → sin registros
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}