import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
const CONTROL_HEIGHT = 52;

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

  const GRID_ROW_OFFSET = 2;
  const ROW_HEIGHT = 32;
  const INITIAL_SCROLL_HOUR = 8;

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

      const companyData = await companyRes.json();
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

      const employees = await employeesRes.json();

      // 🎯 Empleado concreto
      const foundEmployee = employees.find(
        e => e.id === employeeId
      );

      setEmployee(foundEmployee || null);
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

  function toggleDay(day) {
    setSelectedDays(d =>
      d.includes(day) ? d.filter(x => x !== day) : [...d, day],
    );
  }

  function addTurn() {
    if (!startTime || !endTime || selectedDays.length === 0) return;

    setTurns(prev => [
      ...prev,
      {
        days: selectedDays,
        startTime,
        endTime,
        type,
      },
    ]);
  }

  function addVacation() {
    if (!dateFrom || !dateTo) return;
    setVacations(prev => [...prev, { dateFrom, dateTo }]);
  }

  function timeDiffInMinutes(start, end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);

    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;

    if (endMin <= startMin) {
      endMin += 24 * 60;
    }

    return endMin - startMin;
  }

  /* ✅ CÁLCULO CORRECTO DE HORAS TOTALES */
  let totalMinutes = 0;

  turns
    .filter(t => t.type === 'regular')
    .forEach(t => {
      if (!t.startTime || !t.endTime) return;
      totalMinutes += timeDiffInMinutes(t.startTime, t.endTime);
    });

  const totalHours = Math.floor(totalMinutes / 60);
  const totalRestMinutes = totalMinutes % 60;

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
<div className="card" style={{ padding: 32, marginBottom: 40 }}>

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
<div className="card" style={{ padding: 10 }}>
  <h3 style={{ marginBottom: 10 }}>
    Semana del 18 al 24 de marzo
  </h3>

  {/* 🔽 SCROLL HORIZONTAL (días) */}
 <div
  style={{
    overflowY: 'auto',
    overflowX: 'hidden', // ❌ fuera scroll horizontal
    border: '1px solid #e5e7eb',
    borderRadius: 16,
  }}
>
    {/* 🔽 SCROLL VERTICAL (horas) */}
    <div
      ref={calendarRef}
      style={{
        height: 560,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '80px repeat(7, 130px)', // ⬅️ 5 visibles, 2 por scroll
          gridTemplateRows: `40px repeat(48, 28px)`,
          minWidth: 80 + 5 * 180, // ⬅️ fuerza overflow horizontal
          position: 'relative',
          fontSize: 14,
          background: 'white',
        }}
      >
        {/* DAY HEADERS */}
        {weekDays.map((d, i) => (
          <div
            key={d}
            style={{
              gridColumn: i + 2,
              gridRow: 1,
              textAlign: 'center',
              fontWeight: 700,
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 5,
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            {d}
          </div>
        ))}

        {/* HOURS COLUMN */}
        {Array.from({ length: 24 }).map((_, h) => (
          <div
            key={h}
            style={{
              gridColumn: 1,
              gridRow: h * 2 + 2,
              textAlign: 'right',
              paddingRight: 8,
              color: '#6b7280',
              fontSize: 12,
            }}
          >
            {String(h).padStart(2, '0')}:00
          </div>
        ))}

        {/* GRID CELLS */}
        {Array.from({ length: 48 }).map((_, row) =>
          weekDays.map((_, col) => (
            <div
              key={`${row}-${col}`}
              style={{
                gridColumn: col + 2,
                gridRow: row + 2,
                borderLeft: '1px solid #e5e7eb',
                borderBottom: '1px solid #e5e7eb',
              }}
            />
          )),
        )}

        {/* TURNS */}
        {turns.map((t, i) =>
          t.days.map(day => {
            const col = weekDays.indexOf(day) + 2;
            const start = timeToRow(t.startTime);
            let end = timeToRow(t.endTime);

            if (end <= start) end += 48; // nocturno

            return (
              <div
                key={`${i}-${day}`}
                style={{
                  gridColumn: col,
                  gridRow: `${start + 2} / ${end + 2}`,
                  background:
                    t.type === 'regular'
                      ? '#22c55e'
                      : '#f97316',
                  color: 'white',
                  borderRadius: 10,
                  padding: 6,
                  fontSize: 13,
                  margin: 2,
                  zIndex: 3,
                }}
              >
                {t.startTime} – {t.endTime}
              </div>
            );
          }),
        )}
      </div>
    </div>
  </div>
</div>
    </div>
  );
}