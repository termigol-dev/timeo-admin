import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './EmployeeSchedules.css';

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

function minutesToTime(min) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
  const [vacations, setVacations] = useState([]); 
  const [removedTurns, setRemovedTurns] = useState([]);
  const [scheduleId, setScheduleId] = useState(null);

// 🟠 CAMBIOS DEL USUARIO
const [draftTurns, setDraftTurns] = useState([]);

  // 📅 Semana actual (lunes)
  const [weekStart, setWeekStart] = useState(() => {
  const d = new Date();
  const day = d.getDay(); // 0 domingo, 1 lunes...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
});
  const [saving, setSaving] = useState(false);

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
const normalizedTurns = React.useMemo(() => {
  const result = [];

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
        result.push({
          days: [day],
          startTime: minutesToTime(current.start),
          endTime: minutesToTime(current.end),
        });
        current = next;
      }
    }

    result.push({
      days: [day],
      startTime: minutesToTime(current.start),
      endTime: minutesToTime(current.end),
    });
  });

  return result;
}, [turns]);


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

  // TURNOS
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

  // 🟠 VACACIONES (CLAVE)
  if (schedule?.vacations?.length) {
    setVacations(
      schedule.vacations.map(v => ({
        dateFrom: v.dateFrom,
        dateTo: v.dateTo,
        source: 'saved',
      }))
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
  setDraftTurns(prev => [...prev, newTurn]);
  setSelectedDays([]);
  setStartTime('');
  setEndTime('');
}


  function addVacation() {
  if (!dateFrom || !dateTo) return;

  setVacations(prev => [
    ...prev,
    {
      dateFrom,
      dateTo,
      source: 'draft',
    },
  ]);

  setDateFrom('');
  setDateTo('');
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

async function saveVacationToBackend(scheduleId, vacation) {
  const token = localStorage.getItem('token');

  await fetch(
    `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/${scheduleId}/vacations`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateFrom: vacation.dateFrom,
        dateTo: vacation.dateTo,
      }),
    }
  );
}

async function completeSchedule() {
  console.log('▶️ completeSchedule START', {
    scheduleId,
    turns: turns.length,
    vacations: vacations.length,
  });

  const safeDraftTurns = Array.isArray(draftTurns) ? draftTurns : [];
  const safeRemovedTurns = Array.isArray(removedTurns) ? removedTurns : [];
 
  try {
    setSaving(true);
    let id = scheduleId;

    // 1️⃣ Crear borrador si no existe
    if (!id) {
      console.log('🟡 creando draft schedule...');
      id = await createDraftSchedule();
      console.log('🟢 draft creado', id);
    }

    // =========================
    // 2️⃣ TURNOS
    // =========================
    console.log('🟡 guardando turnos +', safeDraftTurns.length);
    for (const turn of safeDraftTurns) {
      await saveTurnToBackend(id, turn);
    }

    // =========================
    // 4️⃣ CONFIRMAR
    // =========================
    console.log('🟡 confirmando horario...');
    const token = localStorage.getItem('token');

    const confirmRes = await fetch(
      `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/${id}/confirm`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!confirmRes.ok) {
      const text = await confirmRes.text();
      throw new Error('CONFIRM FAILED: ' + text);
    }

    console.log('✅ TODO OK — saliendo');
    setDraftTurns([]);
    window.history.back();

  } catch (err) {
    console.error('❌ ERROR EN completeSchedule', err);
    alert(err.message || 'Error guardando horario');
  } finally {
    setSaving(false);
  }
}

const savedTurns = mergeTurns(
  turns.map(t => ({ ...t, source: 'saved' }))
);

const mergedDraftTurns = mergeTurns(
  draftTurns.map(t => ({ ...t, source: 'draft' }))
);


// =========================
// VACACIONES VISUALES (por semana visible)
// =========================
const weekVacationBlocks = [];

vacations.forEach((v, index) => {
  if (!v.dateFrom || !v.dateTo) return;

  const from = new Date(v.dateFrom);
  const to = new Date(v.dateTo);

  weekDates.forEach((date, colIndex) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    if (from <= dayEnd && to >= dayStart) {
      weekVacationBlocks.push({
        col: colIndex + 2,
        source: v.source,
        key: `vac-${index}-${colIndex}`,
      });
    }
  });
});

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

let totalMinutes = 0;

normalizedTurns.forEach(t => {
  totalMinutes += minutesBetween(t.startTime, t.endTime);
});

const totalHours = Math.floor(totalMinutes / 60);
const totalRestMinutes = totalMinutes % 60;


  return (
    <div className="container">
      <h2 className="page-title">
  {company?.commercialName || 'Empresa'} ·{' '}
  {employee
    ? `${employee.name} ${employee.firstSurname}`
    : 'Empleado'}
</h2>

      {/* TODO TU JSX SIGUE EXACTAMENTE IGUAL */}

{/* FORM */}
<div className="form-card">

  {/* DAYS */}
  <div className="days-selector">
    {days.map(d => (
      <label
        key={d.key}
        className="day-checkbox"
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
<div className="form-grid">

{/* LEFT COLUMN */}
<div className="left-column">
  {/* CAPTION IN */}
  <div className="caption">Horario de entrada</div>

  {/* IN */}
  <div className="time-row">
    <span className="badge-in">IN</span>
    <input
      type="time"
      value={startTime}
      onChange={e => setStartTime(e.target.value)}
      className="time-input"
    />
  </div>

  {/* CAPTION OUT */}
  <div className="caption">Horario de salida</div>

  {/* OUT */}
  <div className="time-row">
    <span className="badge-out">OUT</span>
    <input
      type="time"
      value={endTime}
      onChange={e => setEndTime(e.target.value)}
      className="time-input"
    />
  </div>

  {/* TYPE CHECKBOXES */}
  <div className="type-selector">
    <label>
      <input
        type="checkbox"
        checked={type === 'regular'}
        onChange={() => setType('regular')}
      />{' '}
      Horario recurrente
    </label>

    <label>
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
    className="primary-button add-turn"
  >
    Añadir turno
  </button>

  <button
    onClick={addVacation}
    className="primary-button add-vacation"
  >
    Añadir vacaciones
  </button>
</div>


  {/* RIGHT COLUMN */}
<div className="right-column">
  {/* CAPTION DATE FROM */}
  <div className="caption">Fecha de inicio</div>
  <input
    type="date"
    value={dateFrom}
    onChange={e => setDateFrom(e.target.value)}
    className="date-input"
  />

  {/* CAPTION DATE TO */}
  <div className="caption">Fecha de fin</div>
  <input
    type="date"
    value={dateTo}
    onChange={e => setDateTo(e.target.value)}
    className="date-input"
  />

  {/* TOTAL HOURS */}
  <div className="total-hours">
    <div className="total-hours-number">
      {totalHours}
      <span className="total-hours-minutes">
        {totalRestMinutes > 0
          ? `:${String(totalRestMinutes).padStart(2, '0')}`
          : ''}
      </span>
    </div>

    <div className="total-hours-label">
      horas totales (horario regular)
    </div>
  </div>

  {/* COMPLETED */}
  <button
    onClick={completeSchedule}
    className="complete-button"
  >
    Horario completado
  </button>
</div>
  </div>
</div>

{/* WEEKLY CALENDAR */}
<div className="calendar-wrapper">

  {/* HEADER */}
  <div className="calendar-header">
    <div className="calendar-week-text">
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

    <div className="calendar-controls">
      <button
        onClick={() =>
          setWeekStart(d => {
            const prev = new Date(d);
            prev.setDate(prev.getDate() - 7);
            return prev;
          })
        }
        className="calendar-button"
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
        className="calendar-button"
      >
        →
      </button>

      <select
        value={weekStart.getMonth()}
        onChange={e => {
          const d = new Date(weekStart);
          d.setMonth(Number(e.target.value));
          setWeekStart(d);
        }}
        className="calendar-select"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <option key={i} value={i}>
            {new Date(0, i).toLocaleString('es-ES', { month: 'short' })}
          </option>
        ))}
      </select>

      <select
        value={weekStart.getFullYear()}
        onChange={e => {
          const d = new Date(weekStart);
          d.setFullYear(Number(e.target.value));
          setWeekStart(d);
        }}
        className="calendar-select"
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

  {/* GRID */}
  <div className="calendar-grid-wrapper">

    {/* DAYS HEADER */}
    <div className="calendar-days-header">
      <div />
      {weekDays.map(d => (
        <div key={d} className="calendar-day">
          {d}
        </div>
      ))}
    </div>

    {/* SCROLLABLE BODY */}
    <div
      ref={calendarRef}
      onMouseDown={() => setCalendarFocused(true)}
     className={`calendar-scroll ${calendarFocused ? 'focused' : ''}`}
    >
      <div
        className="calendar-grid calendar-grid-rows"
      >
        {/* HOURS */}
        {Array.from({ length: 24 }).map((_, h) => (
          <div
            key={h}
            className="hour-label"
            style={{ gridRow: h * 2 + 1 }}
          >
            {String(h).padStart(2, '0')}:00
          </div>
        ))}

        {/* GRID CELLS */}
        {Array.from({ length: 48 }).map((_, row) =>
          weekDays.map((_, col) => (
            <div
              key={`${row}-${col}`}
              className="calendar-cell"
              style={{
                gridColumn: col + 2,
                gridRow: row + 1,
              }}
            />
          ))
        )}

        {/* VACATIONS */}
        {weekVacationBlocks.map(v => (
          <div
            key={v.key}
            className={`vacation ${v.source === 'draft' ? 'draft' : ''}`}
            style={{
              gridColumn: v.col,
              gridRow: '1 / 49',
            }}
          >
            Vacaciones
          </div>
        ))}

        {/* SAVED TURNS */}
        {savedTurns.map((t, i) =>
          t.days.map(day => {
            const col = weekDays.indexOf(day) + 2;
            const start = timeToRow(t.startTime);
            let end = timeToRow(t.endTime);
            if (end <= start) end += 48;

            return (
              <div
                key={`saved-${i}-${day}`}
                className="turn-saved"
                style={{
                  gridColumn: col,
                  gridRow: `${start + 1} / ${end + 1}`,
                }}
              >
                {t.startTime} – {t.endTime}
              </div>
            );
          })
        )}

        {/* DRAFT TURNS */}
        {mergedDraftTurns.map((t, i) =>
          t.days.map(day => {
            const col = weekDays.indexOf(day) + 2;
            const start = timeToRow(t.startTime);
            let end = timeToRow(t.endTime);
            if (end <= start) end += 48;

            return (
              <div
                key={`draft-${i}-${day}`}
                className="turn-draft"
                style={{
                  gridColumn: col,
                  gridRow: `${start + 1} / ${end + 1}`,
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