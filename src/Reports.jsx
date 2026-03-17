import React, { useEffect, useState, useMemo } from 'react';
import { getMyReports } from './api';
import { useParams } from 'react-router-dom';
import ReportText from "./ReportText";
import ReportGraph from "./ReportGraph";
import Logo from "./components/Logo";




/* ---------------- helpers ---------------- */

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToPercent(min) {
  return (min / 1440) * 100;
}

function isoWeekStart(dateStr) {
  const base = new Date(dateStr + 'T12:00:00');

  const jsDay = base.getDay();
  const day = jsDay === 0 ? 7 : jsDay;

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

/* =================================================
   MINUTOS TRABAJADOS EN UNA SEMANA
================================================= */

function calculateWorkedMinutes(week) {

  let total = 0;

  week.daysMap.forEach(day => {

    const records = [...(day.records ?? [])].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    for (let i = 0; i < records.length - 1; i++) {

      const a = records[i];
      const b = records[i + 1];

      if (a.type !== 'IN' || b.type !== 'OUT') continue;

      const start = new Date(a.createdAt);
      const end = new Date(b.createdAt);

      total += (end - start) / 60000;

    }

  });

  return total;
}

/* =================================================
   MINUTOS PREVISTOS EN UNA SEMANA
================================================= */

function calculateExpectedMinutes(week) {

  let total = 0;

  week.daysMap.forEach(day => {

    const shifts = day.shifts ?? [];

    shifts.forEach(s => {

      const [h1, m1] = s.startTime.split(':').map(Number);
      const [h2, m2] = s.endTime.split(':').map(Number);

      const start = h1 * 60 + m1;
      const end = h2 * 60 + m2;

      total += (end - start);

    });

  });

  return total;
}

/* =================================================
   FORMATEAR MINUTOS A "Xh Ym"
================================================= */

function formatMinutes(min) {

  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);

  return `${h}h ${m}m`;
}

/* ------------------------------------------------ */

export default function Reports() {

  const [days, setDays] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const monthName = monthNames[month];
  const [currentWeek, setCurrentWeek] = useState(0);
  const viewMode = 'text';
  const [reportMode, setReportMode] = useState('detailed');
  const [simpleMode, setSimpleMode] = useState(false);

  const { userId } = useParams();

  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  useEffect(() => {
    load();
  }, [year, month]);

  async function load() {

    setLoading(true);

    try {

      const res = await getMyReports({
        userId,
        from,
        to,
      });

      console.log("RESPUESTA BACKEND:", res);
      console.log("EMPLOYEE:", res.employee);
      setDays(res.days || []);
      setEmployee(res.employee);

      setCurrentWeek(0);

    } finally {

      setLoading(false);

    }

  }

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

  const workedMinutes = week ? calculateWorkedMinutes(week) : 0;
  const expectedMinutes = week ? calculateExpectedMinutes(week) : 0;

  return (

    <div
      className="container"
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        paddingBottom: 60 // 👈 AIRE FINAL
      }}
    >
      <div className="report-main-header">

        <Logo size={120} />

        <div className="report-main-name">
          <div className="report-main-employee">
            {employee?.name} {employee?.lastName}
          </div>

          <div className="report-main-company">
            {employee?.companyName}
          </div>
        </div>

        <div className="report-main-title">
          Informe de asistencia — {monthName} {year}
        </div>

      </div>

      <div className="report-toolbar">

        <div className="report-month-navigation">

          <button
            className="report-nav-button"
            onClick={() => {
              if (month === 0) {
                setMonth(11)
                setYear(y => y - 1)
              } else {
                setMonth(m => m - 1)
              }
            }}
          >
            ← Mes anterior
          </button>

          <input
            className="report-month-picker"
            type="month"
            value={`${year}-${String(month + 1).padStart(2, '0')}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-')
              setYear(Number(y))
              setMonth(Number(m) - 1)
            }}
          />

          <button
            className="report-nav-button"
            onClick={() => {
              if (month === 11) {
                setMonth(0)
                setYear(y => y + 1)
              } else {
                setMonth(m => m + 1)
              }
            }}
          >
            Mes siguiente →
          </button>

          <div className="no-print" style={{ display: 'flex', alignItems: 'center', marginLeft: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={simpleMode}
                onChange={(e) => setSimpleMode(e.target.checked)}
              />
              Modo Simplificado
            </label>
          </div>

        </div>

        <button
          className="report-print-button"
          onClick={() => window.print()}
          title="Imprimir informe"
        >
          <span className="material-symbols-outlined">print</span>
        </button>

      </div>



      {viewMode === 'graph' && week && (
        <ReportGraph
          week={week}
          reportMode={reportMode}
          month={month}
        />
      )}

      {viewMode === 'text' && (
        <div className="text-report-grid">

          {weeks.map(w => {

            const workedMinutes = calculateWorkedMinutes(w);
            const expectedMinutes = calculateExpectedMinutes(w);

            let ratio = 0;
            if (expectedMinutes > 0) {
              ratio = Math.round((workedMinutes / expectedMinutes) * 100);
            }

            let ratioColor = "green";

            if (ratio < 70 || ratio > 130) ratioColor = "red";
            else if (ratio < 80 || ratio > 120) ratioColor = "orange";
            else if (ratio < 90 || ratio > 110) ratioColor = "yellow";
            else ratioColor = "green";

            return (
              <ReportText
                key={w.weekStart.toISOString()}
                week={w}
                reportMode={reportMode}
                simpleMode={simpleMode}
                workedTotal={formatMinutes(workedMinutes)}
                expectedTotal={formatMinutes(expectedMinutes)}

                ratioPercent={ratio}
                ratioColor={ratioColor}
              />
            );

          })}

        </div>
      )}
      {!simpleMode && (
        <div className="report-legend">

          <b>Leyenda</b>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
              marginTop: 8,
              fontSize: 13
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
      )}
    </div>

  );

}