import React, { useEffect, useState, useMemo } from 'react';
import { getMyReports } from './api';
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

    const jsDay = base.getDay(); // 0..6
    const day = jsDay === 0 ? 7 : jsDay; // 1..7

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
    const [loading, setLoading] = useState(true);

    const today = new Date();

    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());

    const [currentWeek, setCurrentWeek] = useState(0);
    const [viewMode, setViewMode] = useState('graph');
    // 'graph' | 'text'
    const [reportMode, setReportMode] = useState('detailed');
    // 'simplified' | 'detailed'
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
            const res = await getMyReports({
                userId,
                from,
                to,
            });

            console.log(
                '🧩 days from backend:',
                res.days.map(d => d.date)
            );

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

    /* =================================================
     RENDER TEXT SIMPLIFICADO
  ================================================= */

    function renderTextSimplified(week) {

        return (
            <div
                style={{
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 24,
                    background: '#fff'
                }}
            >

                <div style={{ fontWeight: 600, marginBottom: 12 }}>
                    Semana desde {toISODate(week.weekStart)}
                </div>

                {Array.from({ length: 7 }).map((_, idx) => {

                    const d = addDays(week.weekStart, idx);
                    const dateStr = toISODate(d);
                    const dayData = week.daysMap.get(dateStr);

                    const dayLabel = weekdayName(dateStr);
                    const records = dayData?.records ?? [];

                    if (records.length === 0) return null;

                    return (
                        <div key={dateStr} style={{ marginBottom: 16 }}>

                            <div style={{ fontSize: 18, fontWeight: 700 }}>
                                {dayLabel} — {dateStr}
                            </div>

                            {records
                                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                .map(r => {

                                    const dt = new Date(r.createdAt);
                                    const hh = String(dt.getHours()).padStart(2, '0');
                                    const mm = String(dt.getMinutes()).padStart(2, '0');

                                    return (
                                        <div
                                            key={r.id}
                                            style={{
                                                display: 'flex',
                                                gap: 10,
                                                marginTop: 4,
                                                fontSize: 14
                                            }}
                                        >
                                            <div
                                                style={{
                                                    minWidth: 60,
                                                    textAlign: 'center',
                                                    padding: '4px 8px',
                                                    borderRadius: 6,
                                                    background: r.type === 'IN' ? '#16a34a' : '#dc2626',
                                                    color: '#fff',
                                                    fontWeight: 600
                                                }}
                                            >
                                                {r.type}
                                            </div>

                                            <div>{hh}:{mm}</div>

                                        </div>
                                    );

                                })}
                        </div>
                    );
                })}
            </div>
        );
    }


    /* =================================================
       RENDER TEXT DETALLADO
    ================================================= */

    function renderTextDetailed(week) {

        return (
            <div
                style={{
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 24,
                    background: '#fff'
                }}
            >

                <div style={{ fontWeight: 600, marginBottom: 12 }}>
                    Semana desde {toISODate(week.weekStart)}
                </div>

                {Array.from({ length: 7 }).map((_, idx) => {

                    const d = addDays(week.weekStart, idx);
                    const dateStr = toISODate(d);
                    const dayData = week.daysMap.get(dateStr);

                    const dayLabel = weekdayName(dateStr);

                    const shifts = dayData?.shifts ?? [];
                    const records = dayData?.records ?? [];
                    const incidents = dayData?.incidents ?? [];

                    return (
                        <div key={dateStr} style={{ marginBottom: 20 }}>

                            <div style={{ fontSize: 18, fontWeight: 700 }}>
                                {dayLabel} — {dateStr}
                            </div>

                            <div style={{ marginTop: 6 }}>
                                <b>🟦 Shifts previstos</b>

                                {shifts.length === 0 && <div>— Ninguno</div>}

                                {shifts.map(s => (
                                    <div key={s.id || `${s.startTime}-${s.endTime}`}>
                                        {s.startTime} → {s.endTime}
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: 10 }}>
                                <b>📜 Línea temporal</b>

                                {records.map(r => {

                                    const dt = new Date(r.createdAt);
                                    const hh = String(dt.getHours()).padStart(2, '0');
                                    const mm = String(dt.getMinutes()).padStart(2, '0');

                                    return (
                                        <div key={r.id}>
                                            {r.type} — {hh}:{mm}
                                        </div>
                                    );
                                })}

                                {incidents.map(i => {

                                    const dt = new Date(i.occurredAt || i.createdAt);
                                    const hh = String(dt.getHours()).padStart(2, '0');
                                    const mm = String(dt.getMinutes()).padStart(2, '0');

                                    return (
                                        <div key={i.id}>
                                            ⚠ {i.type} — {hh}:{mm}
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    );
                })}
            </div>
        );
    }

    const week = weeks[currentWeek];

    /* =================================================
     HORAS SEMANA
    ================================================= */

    const workedMinutes = week ? calculateWorkedMinutes(week) : 0;
    const expectedMinutes = week ? calculateExpectedMinutes(week) : 0;

    return (
        <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>

            <h2>Informes</h2>

            {week && (
                <div
                    style={{
                        display: 'flex',
                        gap: 24,
                        marginBottom: 16,
                        fontSize: 16,
                        fontWeight: 600
                    }}
                >
                    <div>
                        ⏱ Trabajado: {formatMinutes(workedMinutes)}
                    </div>

                    <div>
                        📅 Previsto: {formatMinutes(expectedMinutes)}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button
                    onClick={() => {
                        console.log('🔵 Cambiando a vista gráfica');
                        setViewMode('graph');
                    }}
                    style={{
                        padding: '6px 12px',
                        background: viewMode === 'graph' ? '#2563eb' : '#e5e7eb',
                        color: viewMode === 'graph' ? '#fff' : '#000',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer'
                    }}
                >
                    Vista gráfica
                </button>

                <button
                    onClick={() => {
                        console.log('🟢 Cambiando a vista texto');
                        setViewMode('text');
                    }}
                    style={{
                        padding: '6px 12px',
                        background: viewMode === 'text' ? '#2563eb' : '#e5e7eb',
                        color: viewMode === 'text' ? '#fff' : '#000',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer'
                    }}
                >
                    Vista texto (debug)
                </button>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                        type="checkbox"
                        checked={reportMode === 'simplified'}
                        onChange={() => setReportMode('simplified')}
                    />
                    Informe simplificado
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                        type="checkbox"
                        checked={reportMode === 'detailed'}
                        onChange={() => setReportMode('detailed')}
                    />
                    Informe detallado
                </label>

            </div>

            {/* selector mes / año */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>

                <select
                    value={month}
                    onChange={e => setMonth(Number(e.target.value))}
                >
                    {[
                        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                    ].map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                    ))}
                </select>

                <select
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                >
                    {[2024, 2025, 2026, 2027, 2028].map(y => (
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

            {week && viewMode === 'graph' && (

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

                    {Array.from({ length: 7 }).map((_, idx) => {

                        const d = addDays(week.weekStart, idx);
                        const dateStr = toISODate(d);

                        const dayData = week.daysMap.get(dateStr);

                        const isSameMonth = d.getMonth() === month;

                        const dayLabel = weekdayName(dateStr);

                        const shifts = dayData?.shifts || [];
                        const records = dayData?.records || [];
                        const incidents = dayData?.incidents || [];

                        if (reportMode === 'simplified' && records.length === 0) {
                            return null;
                        }

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
                                    {reportMode === 'detailed' && shifts.map(s => {

                                        const start = timeToMinutes(s.startTime);
                                        const end = timeToMinutes(s.endTime);

                                        return (
                                            <div
                                                key={`${s.startTime}_${s.endTime}`}
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

                                        const ordered = [...records].sort(
                                            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                                        );

                                        const blocks = [];

                                        for (let i = 0; i < ordered.length - 1; i++) {

                                            const a = ordered[i];
                                            const b = ordered[i + 1];

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
                                                />
                                            );
                                        }

                                        return blocks;
                                    })()}

                                    {/* incidencias */}
                                    {reportMode === 'detailed' && incidents.map(i => {

                                        const dateStr = i.occurredAt || i.createdAt;
                                        const timePart = dateStr.slice(11, 16); // "HH:MM"
                                        const min = timeToMinutes(timePart);

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

            {week && viewMode === 'text' && (
                reportMode === 'simplified'
                    ? renderTextSimplified(week)
                    : renderTextDetailed(week)
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