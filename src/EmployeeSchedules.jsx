import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

//const CONTROL_HEIGHT = 52;
const days = [
  { key: 'L', label: 'Lunes' },
  { key: 'M', label: 'Martes' },
  { key: 'X', label: 'Miércoles' },
  { key: 'J', label: 'Jueves' },
  { key: 'V', label: 'Viernes' },
  { key: 'S', label: 'Sábado' },
  { key: 'D', label: 'Domingo' },
];

const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function timeToRow(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 2 + (m >= 30 ? 1 : 0);
}

function mergeTurns(turns) {
  const byDay = {};

  for (const t of turns) {
    const day = t.days[0];
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push({ ...t });
  }

  const result = [];

  for (const day in byDay) {
    const list = byDay[day]
      .map(t => ({
        ...t,
        startMin: timeToMinutes(t.startTime),
        endMin:
          timeToMinutes(t.endTime) <= timeToMinutes(t.startTime)
            ? timeToMinutes(t.endTime) + 1440
            : timeToMinutes(t.endTime),
      }))
      .sort((a, b) => a.startMin - b.startMin);

    let current = null;

    for (const t of list) {
      if (!current) {
        current = { ...t };
        continue;
      }

      if (t.startMin <= current.endMin) {
        current.endMin = Math.max(current.endMin, t.endMin);
      } else {
        result.push({
          days: [day],
          startTime: minutesToTime(current.startMin),
          endTime: minutesToTime(current.endMin),
          source: current.source,
          type: current.type,
        });
        current = { ...t };
      }
    }

    if (current) {
      result.push({
        days: [day],
        startTime: minutesToTime(current.startMin),
        endTime: minutesToTime(current.endMin),
        source: current.source,
        type: current.type,
      });
    }
  }

  return result;
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function toMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function buildVisualBlocks(turns) {
  const blocksByDay = {};

  for (const t of turns) {
    for (const day of t.days) {
      if (!blocksByDay[day]) blocksByDay[day] = [];

      blocksByDay[day].push({
        start: t.startTime,
        end: t.endTime,
        isDraft: t.source === 'draft',
      });
    }
  }

  const result = [];

  for (const day of Object.keys(blocksByDay)) {
    const blocks = blocksByDay[day]
      .map(b => ({
        ...b,
        startMin: toMinutes(b.start),
        endMin: toMinutes(b.end),
      }))
      .sort((a, b) => a.startMin - b.startMin);

    let current = null;

    for (const b of blocks) {
      if (!current || b.startMin > current.endMin) {
        if (current) result.push(current);

        current = {
          day,
          startTime: b.start,
          endTime: b.end,
          startMin: b.startMin,
          endMin: b.endMin,
          isDraft: b.isDraft,
        };
      } else {
        current.endMin = Math.max(current.endMin, b.endMin);
        current.endTime =
          b.endMin >= current.endMin ? b.end : current.endTime;

        current.isDraft = current.isDraft || b.isDraft;
      }
    }

    if (current) result.push(current);
  }

  return result;
}

function minutesToTime(min) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildVacationBlocks(vacations) {
  const result = [];

  for (const v of vacations) {
    const start = 0;       // 00:00
    const end = 24 * 60;   // 24:00

    result.push({
      day: v.day,
      startTime: '00:00',
      endTime: '24:00',
      startMin: start,
      endMin: end,
      source: v.source, // 'saved' | 'draft'
    });
  }

  return result;
}

export default function EmployeeSchedules() {
  const { companyId, employeeId } = useParams();
  const calendarRef = useRef(null);

  /* 🆕 DATOS CABECERA */
  
  const [company, setCompany] = useState(null);
  const [employee, setEmployee] = useState(null);

  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState('regular');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [turns, setTurns] = useState([]);
  // 🆕 VACACIONES
  const [vacations, setVacations] = useState([]);
  const [scheduleId, setScheduleId] = useState(null);
  // 📅 Semana actual (lunes)
  const [weekStart, setWeekStart] = useState(() => {
  const d = new Date();
  const day = d.getDay(); // 0 domingo, 1 lunes...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
});
  const [saving, setSaving] = useState(false);
  const GRID_ROW_OFFSET = 2;
  const ROW_HEIGHT = 24;
  const INITIAL_SCROLL_HOUR = 8;

  const [calendarFocused, setCalendarFocused] = useState(false);
 
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date(weekStart);
  d.setDate(weekStart.getDate() + i);
  return d;
});

/* ======================================================
   NORMALIZACIÓN DE TURNOS (VISUAL + CONTADOR)
   - Une tramos contiguos o solapados
   - NO modifica `turns`
====================================================== */

const normalizedTurns = [];

weekDays.forEach(day => {
  const dayTurns = turns
    .filter(t => t.days.includes(day) && t.type === 'regular')
    .map(t => ({
      start: timeToMinutes(t.startTime),
      end:
        timeToMinutes(t.endTime) <= timeToMinutes(t.startTime)
          ? timeToMinutes(t.endTime) + 1440
          : timeToMinutes(t.endTime),
    }))
    .sort((a, b) => a.start - b.start);

  if (!dayTurns.length) return;

  let current = dayTurns[0];

  for (let i = 1; i < dayTurns.length; i++) {
    const next = dayTurns[i];

    if (next.start <= current.end) {
      current.end = Math.max(current.end, next.end);
    } else {
      normalizedTurns.push({
        days: [day],
        startTime: minutesToTime(current.start),
        endTime: minutesToTime(current.end),
      });
      current = next;
    }
  }

  normalizedTurns.push({
    days: [day],
    startTime: minutesToTime(current.start),
    endTime: minutesToTime(current.end),
  });
});


  /* 🆕 CARGA EMPRESA + EMPLEADO */
  useEffect(() => {
  async function loadHeaderData() {
    try {
      const token = localStorage.getItem('token');

      // 🏢 Empresa
      const companyRes = await fetch(
        `${import.meta.env.VITE_API_URL}/companies/${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!companyRes.ok) {
        const text = await companyRes.text();
        console.error('Error cargando empresa:', text);
        return;
      }

      const companyData = await safeJson(companyRes);
if (!companyData) {
  console.error('Respuesta vacía al cargar empresa');
  return;
}
setCompany(companyData);

      // 👤 Empleados de la empresa
      const employeesRes = await fetch(
        `${import.meta.env.VITE_API_URL}/companies/${companyId}/employees`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!employeesRes.ok) {
        const text = await employeesRes.text();
        console.error('Error cargando empleados:', text);
        return;
      }

      const employees = await safeJson(employeesRes);
if (!employees) {
  console.error('Respuesta vacía al cargar empleados');
  return;
}

      // 🎯 Empleado concreto
      const foundEmployee = employees.find(
        e => e.id === employeeId
      );

      setEmployee(foundEmployee || null);

// 📅 CARGAR HORARIO ACTIVO DEL EMPLEADO (VISUAL)
if (foundEmployee?.branchId) {
  const scheduleRes = await fetch(
    `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${foundEmployee.branchId}/schedules/user/${employeeId}/active`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (scheduleRes.ok) {
    const schedule = await scheduleRes.json();

    if (schedule?.shifts?.length) {
      const loadedTurns = schedule.shifts.map(shift => ({
        days: [weekDays[shift.weekday - 1]],
        startTime: shift.startTime,
        endTime: shift.endTime,
        type: 'regular',
        source: 'saved',
      }));

      setTurns(loadedTurns);
      setScheduleId(schedule.id);
    }

    // 🆕 VACACIONES DESDE BACKEND
if (schedule?.vacations?.length) {
  setVacations(
    schedule.vacations.map(v => {
      const d = new Date(v.date);
      const wd = d.getDay();
      return {
        day: weekDays[wd === 0 ? 6 : wd - 1],
        source: 'saved',
      };
    })
  );
}

  }
}

    } catch (err) {
      console.error('Error cargando empresa / empleado', err);
    }
  }

  loadHeaderData();
}, [companyId, employeeId]);

  /* SCROLL INICIAL DEL CALENDARIO */
  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.scrollTop =
        INITIAL_SCROLL_HOUR * 2 * ROW_HEIGHT;
    }
  }, []);

  useEffect(() => {
  const calendar = calendarRef.current;
  if (!calendar) return;

  const HOUR_SCROLL = ROW_HEIGHT * 2; // 1 hora exacta

  function onWheel(e) {
    // ⚠️ solo actuamos si el calendario tiene el foco
    if (!calendar.contains(document.activeElement)) return;

    e.preventDefault();

    const direction = e.deltaY > 0 ? 1 : -1;

    calendar.scrollTo({
      top: calendar.scrollTop + direction * HOUR_SCROLL,
      behavior: 'smooth',
    });
  }

  calendar.addEventListener('wheel', onWheel, {
    passive: false,
  });

  return () => {
    calendar.removeEventListener('wheel', onWheel);
  };
}, []);

// 👆 Detectar click fuera del calendario → devolver scroll global
useEffect(() => {
  function handleClickOutside(e) {
    if (
      calendarRef.current &&
      !calendarRef.current.contains(e.target)
    ) {
      setCalendarFocused(false);
    }
  }

  document.addEventListener('mousedown', handleClickOutside);
  return () =>
    document.removeEventListener('mousedown', handleClickOutside);
}, []);

  function toggleDay(day) {
    setSelectedDays(d =>
      d.includes(day) ? d.filter(x => x !== day) : [...d, day],
    );
  }

function hasOverlap(newTurn) {
  const toMinutes = t => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const newStart = toMinutes(newTurn.startTime);
  const newEnd =
    toMinutes(newTurn.endTime) <= newStart
      ? toMinutes(newTurn.endTime) + 1440
      : toMinutes(newTurn.endTime);

  return turns.some(existing =>
    existing.days.some(day =>
      newTurn.days.includes(day) &&
      toMinutes(existing.startTime) < newEnd &&
      (toMinutes(existing.endTime) <= toMinutes(existing.startTime)
        ? toMinutes(existing.endTime) + 1440
        : toMinutes(existing.endTime)) > newStart
    )
  );
}

async function addTurn() {
  if (!startTime || !endTime || selectedDays.length === 0) return;

  const newTurn = {
    days: selectedDays,
    startTime,
    endTime,
    type,
    source: 'draft',
  };

  // ⛔ VALIDACIÓN DE SOLAPAMIENTO
  if (hasOverlap(newTurn)) {
    alert(
      'El turno que intentas añadir se solapa parcial o totalmente con otro ya existente.'
    );
    return;
  }

  // ✅ SOLO VISUAL
  setTurns(prev => [...prev, newTurn]);
  setSelectedDays([]);
  setStartTime('');
  setEndTime('');
}


function addVacation() {
  if (!dateFrom || !dateTo) return;

  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  const newVacations = [];

  for (
    let d = new Date(start);
    d <= end;
    d.setDate(d.getDate() + 1)
  ) {
    const jsDay = d.getDay(); // 0 domingo - 6 sábado

    const dayMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const day = dayMap[jsDay];

    newVacations.push({
      day,
      source: 'draft',
    });
  }

  setVacations(prev => [...prev, ...newVacations]);
}

  async function createDraftSchedule() {
  const token = localStorage.getItem('token');

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/draft/${employeeId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error creando horario');
  }

  const schedule = await res.json();
  setScheduleId(schedule.id);
  return schedule.id;
}

async function saveTurnToBackend(scheduleId, turn) {
  const token = localStorage.getItem('token');

  for (const day of turn.days) {
    await fetch(
      `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/${scheduleId}/shifts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekday: weekDays.indexOf(day) + 1,
          startTime: turn.startTime,
          endTime: turn.endTime,
        }),
      }
    );
  }
}

async function completeSchedule() {
  if (turns.length === 0) {
    alert('No hay turnos para guardar');
    return;
  }

  try {
    setSaving(true);
    let id = scheduleId;

    // 1️⃣ Crear borrador si no existe
    if (!id) {
      id = await createDraftSchedule();
    }

    // 2️⃣ Guardar TODOS los turnos
    for (const turn of turns) {
      await saveTurnToBackend(id, turn);
    }

    // 3️⃣ Confirmar horario
    const token = localStorage.getItem('token');
    await fetch(
      `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/${id}/confirm`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 4️⃣ Salir
    window.history.back();
  } catch (err) {
    console.error('Error completando horario', err);
    alert('Error al guardar el horario');
  } finally {
    setSaving(false);
  }
}

const vacationDays = new Set(
  vacations.map(v => v.day)
);

const savedTurns = mergeTurns(
  turns.filter(
    t =>
      t.source === 'saved' &&
      !t.days.some(day => vacationDays.has(day))
  )
);

const draftTurns = mergeTurns(
  turns.filter(
    t =>
      t.source === 'draft' &&
      !t.days.some(day => vacationDays.has(day))
  )
);

/* ======================================================
   CÁLCULO CORRECTO DE HORAS (FRONTEND)
   - Cada turno YA corresponde a un día
   - NO se multiplica por days
====================================================== */

function minutesBetween(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;

  // Turno nocturno
  if (endMin <= startMin) {
    endMin += 24 * 60;
  }

  return endMin - startMin;
}

// 🔑 clave única por día + franja
const uniqueTurns = new Map();

turns
  .filter(t => t.type === 'regular')
  .forEach(t => {
    const day = t.days[0]; // cada turno YA es por día
    const key = `${day}-${t.startTime}-${t.endTime}`;
    uniqueTurns.set(key, t);
  });

let totalMinutes = 0;

normalizedTurns.forEach(t => {
  totalMinutes += minutesBetween(t.startTime, t.endTime);
});

const totalHours = Math.floor(totalMinutes / 60);
const totalRestMinutes = totalMinutes % 60;
console.log(
  'TURNOS CONTADOS:',
  turns.map(t => `${t.startTime}-${t.endTime} (${t.days.join(',')})`)
);

const visualBlocks = buildVisualBlocks(turns);

  return (
    <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 32 }}>
  {company?.commercialName || 'Empresa'} ·{' '}
  {employee
    ? `${employee.name} ${employee.firstSurname}`
    : 'Empleado'}
</h2>

      {/* TODO TU JSX SIGUE EXACTAMENTE IGUAL */}

{/* FORM */}
<div className="card" style={{ padding: 20, marginBottom: 5 }}>

  {/* DAYS */}
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      gap: 22,
      marginBottom: 10,
      padding: '14px 0',
      background: '#ccfbf1', // turquesa suave
      borderRadius: 14,
    }}
  >
    {days.map(d => (
      <label
        key={d.key}
        style={{
          fontSize: 20,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <input
          type="checkbox"
          checked={selectedDays.includes(d.key)}
          onChange={() => toggleDay(d.key)}
        />
        {d.key === 'X' ? 'X' : d.label[0]}
      </label>
    ))}
  </div>

  {/* TWO COLUMNS */}
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 36,
    }}
  >
    {/* LEFT COLUMN */}
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 14,
        background: '#f0fdf4', // verde muy tenue
        padding: 24,
        borderRadius: 16,
      }}
    >
      {/* CAPTION IN */}
      <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>
        Horario de entrada
      </div>

      {/* IN */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          style={{
            background: '#22c55e',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 14,
            fontWeight: 800,
            width: 48,
            textAlign: 'center',
          }}
        >
          IN
        </span>
        <input
          type="time"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          style={{
            width: 160,
            fontSize: 18,
            padding: '10px 12px',
            borderRadius: 12,
          }}
        />
      </div>

      {/* CAPTION OUT */}
      <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>
        Horario de salida
      </div>

      {/* OUT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          style={{
            background: '#ef4444',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 14,
            fontWeight: 800,
            width: 48,
            textAlign: 'center',
          }}
        >
          OUT
        </span>
        <input
          type="time"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          style={{
            width: 160,
            fontSize: 18,
            padding: '10px 12px',
            borderRadius: 12,
          }}
        />
      </div>

      {/* TYPE CHECKBOXES */}
      <div
        style={{
          display: 'flex',
          gap: 18,
          marginTop: 6,
        }}
      >
        <label style={{ fontSize: 15, fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={type === 'regular'}
            onChange={() => setType('regular')}
          />{' '}
          Horario recurrente
        </label>

        <label style={{ fontSize: 15, fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={type === 'special'}
            onChange={() => setType('special')}
          />{' '}
          Horas extra
        </label>
      </div>

      {/* BUTTONS */}
      <button
        onClick={addTurn}
        style={{
          width: 220,
          marginTop: 10,
          padding: '14px 0',
          fontSize: 18,
          fontWeight: 700,
          borderRadius: 14,
          background: '#22c55e',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Añadir turno
      </button>

      <button
        onClick={addVacation}
        style={{
          width: 220,
          marginTop: 10,
          padding: '14px 0',
          fontSize: 18,
          fontWeight: 700,
          borderRadius: 14,
          background: '#f97316',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Añadir vacaciones
      </button>
    </div>

    {/* RIGHT COLUMN */}
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 14,
        background: '#f8fafc', // gris muy tenue
        padding: 24,
        borderRadius: 16,
      }}
    >
      {/* CAPTION DATE FROM */}
      <div style={{ fontSize: 13, fontWeight: 600 }}>
        Fecha de inicio
      </div>
      <input
        type="date"
        value={dateFrom}
        onChange={e => setDateFrom(e.target.value)}
        style={{
          width: 220,
          fontSize: 16,
          padding: '10px 12px',
          borderRadius: 12,
        }}
      />

      {/* CAPTION DATE TO */}
      <div style={{ fontSize: 13, fontWeight: 600 }}>
        Fecha de fin
      </div>
      <input
        type="date"
        value={dateTo}
        onChange={e => setDateTo(e.target.value)}
        style={{
          width: 220,
          fontSize: 16,
          padding: '10px 12px',
          borderRadius: 12,
        }}
      />

      {/* TOTAL HOURS */}
      <div
        style={{
          marginTop: 24,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {totalHours}
          <span style={{ fontSize: 32 }}>
            {totalRestMinutes > 0
              ? `:${String(totalRestMinutes).padStart(2, '0')}`
              : ''}
          </span>
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 14,
            fontWeight: 600,
            color: '#6b7280',
          }}
        >
          horas totales (horario regular)
        </div>
      </div>

      {/* COMPLETED */}
      <button
        onClick={completeSchedule}
        style={{
          width: '100%',
          marginTop: 18,
          padding: '14px 0',
          fontSize: 16,
          fontWeight: 700,
          borderRadius: 14,
          background: '#14b8a6', // turquesa intenso
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Horario completado
      </button>
    </div>
  </div>
</div>

{/* WEEKLY CALENDAR */}
<div
  className="card"
  style={{
    marginTop: 0,
    padding: 10,
    background: '#ccfbf1',
    borderRadius: 20,
    maxWidth: 1140,
    marginLeft: 'auto',
    marginRight: 'auto',
  }}
>

  {/* HEADER CALENDARIO */}
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '6px 8px',
    marginBottom: 6,
  }}
>
  {/* Texto semana */}
  <div style={{ fontWeight: 600 }}>
    Semana del{' '}
    {weekDates[0].toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    })}{' '}
    –{' '}
    {weekDates[6].toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    })}
  </div>

  {/* Controles */}
  <div style={{ display: 'flex', gap: 6 }}>
    <button
      onClick={() =>
        setWeekStart(d => {
          const prev = new Date(d);
          prev.setDate(prev.getDate() - 7);
          return prev;
        })
      }
      style={{
        padding: '4px 10px',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: 'white',
        cursor: 'pointer',
      }}
    >
      ←
    </button>

    <button
      onClick={() =>
        setWeekStart(d => {
          const next = new Date(d);
          next.setDate(next.getDate() + 7);
          return next;
        })
      }
      style={{
        padding: '4px 10px',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: 'white',
        cursor: 'pointer',
      }}
    >
      →
    </button>

    {/* Selector de mes */}
    <select
      value={weekStart.getMonth()}
      onChange={e => {
        const d = new Date(weekStart);
        d.setMonth(Number(e.target.value));
        setWeekStart(d);
      }}
      style={{
        padding: '4px 8px',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: 'white',
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <option key={i} value={i}>
          {new Date(0, i).toLocaleString('es-ES', {
            month: 'short',
          })}
        </option>
      ))}
    </select>

    {/* Selector de año */}
    <select
      value={weekStart.getFullYear()}
      onChange={e => {
        const d = new Date(weekStart);
        d.setFullYear(Number(e.target.value));
        setWeekStart(d);
      }}
      style={{
        padding: '4px 8px',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: 'white',
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const year = new Date().getFullYear() - 2 + i;
        return (
          <option key={year} value={year}>
            {year}
          </option>
        );
      })}
    </select>
  </div>
</div>

  {/* MARCO CALENDARIO */}
  <div
    style={{
      background: 'white',
      borderRadius: 16,
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
    }}
  >
    {/* CABECERA DÍAS (FIJA) */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '90px repeat(7, 140px)',
        height: 40,
        borderBottom: '5px solid #e5e7eb',
        background: 'white',
        zIndex: 2,
      }}
    >
      <div /> {/* esquina horas */}
      {weekDays.map(d => (
        <div
          key={d}
          style={{
            textAlign: 'center',
            fontWeight: 700,
            lineHeight: '40px',
          }}
        >
          {d}
        </div>
      ))}
    </div>

    {/* CUERPO SCROLLEABLE */}
    <div
      ref={calendarRef}
      onMouseDown={() => setCalendarFocused(true)}
      style={{
        height: 360,
        overflowY: calendarFocused ? 'auto' : 'hidden',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '90px repeat(7, 140px)',
          gridTemplateRows: `repeat(48, ${ROW_HEIGHT}px)`,
          fontSize: 14,
        }}
      >
        {/* HORAS */}
        {Array.from({ length: 24 }).map((_, h) => (
          <div
            key={h}
            style={{
              gridColumn: 1,
              gridRow: h * 2 + 1,
              textAlign: 'right',
              paddingRight: 8,
              color: '#6b7280',
              fontSize: 12,
            }}
          >
            {String(h).padStart(2, '0')}:00
          </div>
        ))}

        {/* GRID */}
        {Array.from({ length: 48 }).map((_, row) =>
          weekDays.map((_, col) => (
            <div
              key={`${row}-${col}`}
              style={{
                gridColumn: col + 2,
                gridRow: row + 1,
                borderLeft: '1px solid #e5e7eb',
                borderBottom: '1px solid #e5e7eb',
                borderRight: '1px solid #e5e7eb',
              }}
            />
          ))     
        )}

       {/* VACACIONES */}
{vacations.map((v, i) => {
  const col = weekDays.indexOf(v.day) + 2;

  return (
    <div
      key={`vacation-${i}-${v.day}`}
      style={{
        gridColumn: col,
        gridRow: `1 / 49`, // 00:00 → 24:00
        background: '#f97316',
        color: 'white',
        borderRadius: 10,
        margin: 2,
        zIndex: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: 14,
        border:
          v.source === 'draft'
            ? '2px solid #4b5563'
            : 'none',
      }}
    >
      VACACIONES
    </div>
  );
})}

{/* TURNOS GUARDADOS (VERDES) */}
{savedTurns.map((t, i) =>
  t.days.map(day => {
    const col = weekDays.indexOf(day) + 2;
    const start = timeToRow(t.startTime);
    let end = timeToRow(t.endTime);
    if (end <= start) end += 48;

    return (
      <div
        key={`saved-${i}-${day}`}
        style={{
          gridColumn: col,
          gridRow: `${start + 1} / ${end + 1}`,
          background: '#22c55e',
          color: 'white',
          borderRadius: 10,
          padding: 6,
          fontSize: 13,
          margin: 2,
          zIndex: 1,
        }}
      >
        {t.startTime} – {t.endTime}
      </div>
    );
  })
)}

{/* TURNOS BORRADOR (BORDE GRIS) */}
{draftTurns.map((t, i) =>
  t.days.map(day => {
    const col = weekDays.indexOf(day) + 2;
    const start = timeToRow(t.startTime);
    let end = timeToRow(t.endTime);
    if (end <= start) end += 48;

    return (
      <div
        key={`draft-${i}-${day}`}
        style={{
          gridColumn: col,
          gridRow: `${start + 1} / ${end + 1}`,
          background: '#22c55e',
          color: 'white',
          borderRadius: 10,
          padding: 6,
          fontSize: 13,
          margin: 2,
          zIndex: 2,
          border: '2px solid #4b5563',
        }}
      >
        {t.startTime} – {t.endTime}
      </div>
    );
  })
)}
      </div>
    </div>
  </div>
</div>
    </div>
  );
}