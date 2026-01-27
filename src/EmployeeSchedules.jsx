import React, { useState, useRef, useEffect, useMemo } from 'react';
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



const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});


function timeToRow(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 2 + (m >= 30 ? 1 : 0);
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

function normalizeToWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 domingo, 1 lunes...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function EmployeeSchedules() {
  const { companyId, employeeId } = useParams();
  const headerXRef = useRef(null);
  const calendarRef = useRef(null);
  const hoursRef = useRef(null);

  /* 🆕 DATOS CABECERA */

  const [company, setCompany] = useState(null);
  const [employee, setEmployee] = useState(null);

  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState('');
  const [turns, setTurns] = useState([]);
  const [vacations, setVacations] = useState([]);
  // 🟢 MODO EDICIÓN DE TURNO
  const [editingShift, setEditingShift] = useState(null);
  const [editingPreview, setEditingPreview] = useState(null);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [pendingEditShift, setPendingEditShift] = useState(null);
  // 🗑️ BORRADO DE VACACIONES (UX)
  const [vacationToDelete, setVacationToDelete] = useState(null);
  // 🗑️ BORRADO DE TURNOS (UX)
  const [shiftToDelete, setShiftToDelete] = useState(null);

  // { shiftId, day, startTime, endTime }
  const [showShiftDeleteConfirm, setShowShiftDeleteConfirm] = useState(false);
  const [deleteShiftMode, setDeleteShiftMode] = useState('ONLY_THIS_BLOCK');

  const [calendarDays, setCalendarDays] = useState([]);

  const [showVacationConfirm, setShowVacationConfirm] = useState(false);
  const [showVacationMode, setShowVacationMode] = useState(false);

  const [deleteVacationSingle, setDeleteVacationSingle] = useState(true);
  const [deleteVacationForward, setDeleteVacationForward] = useState(false);
  const [removedTurns, setRemovedTurns] = useState([]);
  const [scheduleId, setScheduleId] = useState(null);

  // 🗑️ BORRADO DE TURNOS (UX)
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(null); // null | 1 | 2
  const [deleteSummary, setDeleteSummary] = useState('');

  // 🟠 CAMBIOS DEL USUARIO
  const [draftTurns, setDraftTurns] = useState([]);

  // 📅 Semana actual (lunes)
  const [weekStart, setWeekStart] = useState(() => normalizeToWeekStart(new Date()));
  const [saving, setSaving] = useState(false);

  const [draftExceptions, setDraftExceptions] = useState([]);

  const ROW_HEIGHT = 24;
  const INITIAL_SCROLL_HOUR = 8;
  const [calendarFocused, setCalendarFocused] = useState(false);
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  function isTurnDeletedInDraft({ day, date, startTime, endTime }, draftExceptions) {
    return draftExceptions.some(ex =>
      ex.mode === 'ONLY_THIS_BLOCK' &&
      //ex.day === day &&
      ex.date === date &&
      ex.startTime === startTime &&
      ex.endTime === endTime
    );
  }

  async function reloadActiveSchedule() {
    // 🛑 BLINDAJE DE INICIALIZACIÓN
    if (!employee || !employee.branchId || !employeeId) return;
    if (!employee || !employee.branchId || !employeeId) {
      console.log('⏸️ reloadActiveSchedule cancelado: employee no listo aún');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const weekStartStr = weekStart.toISOString().slice(0, 10);
      console.log('📅 reloadActiveSchedule → semana:', weekStartStr);

      const scheduleRes = await fetch(
        `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/user/${employeeId}/active?weekStart=${weekStartStr}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('🔄 RELOAD STATUS:', scheduleRes.status);

      if (!scheduleRes.ok) {
        console.warn('⚠️ Error cargando semana activa');
        setTurns([]);
        setVacations([]);
        setScheduleId(null);
        return;
      }

      const schedule = await safeJson(scheduleRes);

      console.log('🔄 BACKEND WEEK DATA:', schedule);

      // 🔑 LIMPIAR SIEMPRE ESTADO ANTES DE CONSTRUIR
      const loadedTurns = [];
      const loadedVacations = [];

      if (schedule && Array.isArray(schedule.days)) {

        schedule.days.forEach(day => {
          const dayKey = weekDays[day.weekday - 1]; // 'L', 'M', ...

          // 🟢 TURNOS
          if (Array.isArray(day.turns)) {
            day.turns.forEach(t => {
              loadedTurns.push({
                id: `${day.date}-${t.startTime}-${t.endTime}`,
                days: [dayKey],
                startTime: t.startTime,
                endTime: t.endTime,
                type: t.source === 'extra' ? 'extra' : 'regular',
                source: t.source || 'saved',
                date: day.date,
              });
            });
          }

          // 🟠 VACACIONES
          if (day.isVacation) {
            loadedVacations.push({
              date: day.date,
              source: 'saved',
            });
          }
        });
      } else {
        console.warn('⚠️ schedule.days no válido:', schedule);
      }

      console.log('📊 RESULTADO FINAL SEMANA:', {
        turns: loadedTurns.length,
        vacations: loadedVacations.length,
      });

      // 🔑 ACTUALIZAR ESTADO SIEMPRE, SIN CONDICIONES
      setScheduleId(schedule?.scheduleId || null);
      setTurns(loadedTurns);
      setVacations(loadedVacations);

    } catch (err) {
      console.error('❌ Error en reloadActiveSchedule', err);
      setTurns([]);
      setVacations([]);
      setScheduleId(null);
    }
  }

  // 🛡️ BLINDAJE: nunca permitir edición activa si abrimos el popup de opciones
  useEffect(() => {
    if (showShiftDeleteConfirm) {
      setEditingShift(null);
      setEditingPreview(null);
    }
  }, [showShiftDeleteConfirm]);

  /* ======================================================
     NORMALIZACIÓN DE TURNOS (VISUAL + CONTADOR)
     - Une tramos contiguos o solapados
     - NO modifica `turns`
  ====================================================== */
  const normalizedTurns = React.useMemo(() => {
    const result = [];

    weekDays.forEach(day => {
      const dayTurns = turns
        .filter(t => t.days.includes(day))
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

        console.log('🏢 COMPANY STATUS:', companyRes.status);

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

        console.log('👥 EMPLOYEES STATUS:', employeesRes.status);

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
        const foundEmployee = employees.find(e => e.id === employeeId);
        setEmployee(foundEmployee || null);

        // 📅 CARGAR HORARIO ACTIVO DEL EMPLEADO
        if (foundEmployee?.branchId) {
          const weekStartStr = weekStart.toISOString().slice(0, 10);

          const scheduleRes = await fetch(
            `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${foundEmployee.branchId}/schedules/user/${employeeId}/active?weekStart=${weekStartStr}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log('📅 SCHEDULE STATUS:', scheduleRes.status);

          if (!scheduleRes.ok) {
            const text = await scheduleRes.text();
            console.error('Error cargando horario:', text);
            return;
          }

          const schedule = await safeJson(scheduleRes);

          if (!schedule) {
            console.log('🟡 NO HAY HORARIO ACTIVO (respuesta vacía)');
            setTurns([]);
            setVacations([]);
            setScheduleId(null);
            return;
          }

          console.log('🧪 SCHEDULE ACTIVO RAW (NUEVO MODELO):', schedule);

          // 🔑 CLAVE: aquí NO se construyen turnos ni vacaciones
          // 🔑 TODO el dibujo se delega a reloadActiveSchedule
        }

      } catch (err) {
        console.error('Error cargando empresa / empleado', err);
      }
    }
    loadHeaderData();
  }, [companyId, employeeId, removedTurns]);


  /* SCROLL INICIAL DEL CALENDARIO */
  useEffect(() => {
    const initialScroll = INITIAL_SCROLL_HOUR * 2 * ROW_HEIGHT;

    if (calendarRef.current) {
      calendarRef.current.scrollTop = initialScroll;
    }

    if (hoursRef.current) {
      hoursRef.current.scrollTop = initialScroll;
    }
  }, []);

  useEffect(() => {
    const calendar = calendarRef.current;
    const hours = hoursRef.current;
    if (!calendar || !hours) return;

    function syncScroll() {
      hours.scrollTop = calendar.scrollTop;
    }

    calendar.addEventListener('scroll', syncScroll);
    return () => calendar.removeEventListener('scroll', syncScroll);
  }, []);

  useEffect(() => {
    const calendar = calendarRef.current;
    if (!calendar) return;

    const HOUR_SCROLL = ROW_HEIGHT * 2; // 1 hora exacta

    function onWheel(e) {
      if (!calendarFocused) return;

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
        !calendarRef.current
          .closest('.calendar-grid-wrapper')
          ?.contains(e.target)
      ) {
        setCalendarFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔄 RECARGAR HORARIO CADA VEZ QUE CAMBIA LA SEMANA
  useEffect(() => {
    if (!employee?.branchId || !employeeId) return;

    console.log('🟦 FRONT → weekStart cambió, recargando semana:', weekStart.toISOString().slice(0, 10));

    reloadActiveSchedule();

  }, [weekStart, employeeId, employee?.branchId]);

  useEffect(() => {
    const header = headerXRef.current;
    const grid = calendarRef.current;

    if (!header || !grid) return;

    function syncHorizontalScroll() {
      grid.scrollLeft = header.scrollLeft;
    }

    header.addEventListener('scroll', syncHorizontalScroll);

    return () => {
      header.removeEventListener('scroll', syncHorizontalScroll);
    };
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
      source: 'draft',
    };

    // ======================================================
    // 🔵 CASO EDICIÓN DE TURNO EXISTENTE
    // ======================================================
    if (editingShift) {
      console.log('✏️ ADD TURN DESDE EDICIÓN → reemplazando turno antiguo');

      // 1️⃣ Marcar turno antiguo como eliminado SOLO EN FRONT
      setRemovedTurns(prev => [
        ...prev,
        {
          day: editingShift.day,
          startTime: editingShift.startTime,
          endTime: editingShift.endTime,
          date: editingShift.date,
        },
      ]);

      // 2️⃣ Añadir el nuevo turno editado al draft
      setDraftTurns(prev => [...prev, newTurn]);

      // 3️⃣ Limpiar modo edición
      setEditingShift(null);
      setEditingPreview(null);
      setSelectedDays([]);
      setStartTime('');
      setEndTime('');

      return; // 🔑 IMPORTANTE: salir aquí, no seguir
    }

    // ======================================================
    // 🟢 CASO AÑADIR TURNO NORMAL
    // ======================================================

    // ⛔ VALIDACIÓN DE SOLAPAMIENTO SOLO AQUÍ
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

  function handleDeleteBlock() {
    // CASO A3: solo horas, sin fechas
    if (!dateFrom && !dateTo && (startTime || endTime)) {
      setDeleteSummary(
        `Se van a borrar TODOS los turnos en el rango horario ${startTime || '—'} – ${endTime || '—'} a partir de hoy.`
      );
      setDeleteConfirmStep(1);
      return;
    }

    // CASO A1: solo fecha inicio
    if (dateFrom && !dateTo) {
      setDeleteSummary(
        `No has incluido fecha fin. Se borrarán todos los turnos del día ${dateFrom}${startTime ? ` entre ${startTime} y ${endTime}` : ''}.`
      );
      setDeleteConfirmStep(1);
      return;
    }

    // CASO A2: fecha inicio + fecha fin
    if (dateFrom && dateTo) {
      setDeleteSummary(
        `Se borrarán todos los turnos desde ${dateFrom} hasta ${dateTo}${startTime ? ` entre ${startTime} y ${endTime}` : ''}.`
      );
      setDeleteConfirmStep(2);
      return;
    }

    alert('Debes seleccionar al menos una fecha o un rango horario para borrar.');
  }

  function addVacation() {
    if (!dateFrom || !dateTo) return;

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const days = [];

    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      days.push({
        date: d.toISOString().slice(0, 10),
        source: 'draft',
      });
    }

    //console.log('🟠 VACATION DAYS ADDED:', days);

    setVacations(prev => [...prev, ...days]);
    setDateFrom('');
    setDateTo('');
  }

  function handleConfirmDeleteShift() {
    if (!shiftToDelete || !deleteShiftMode) return;

    const mode = deleteShiftMode;

    const today = new Date().toISOString().slice(0, 10);
    if (shiftToDelete.date < today && mode !== 'ONLY_THIS_BLOCK') {
      alert('No se pueden borrar turnos del pasado en bloque');
      return;
    }

    setDraftExceptions(prev => [
      ...prev,
      {
        type: 'MODIFIED_SHIFT',
        date: shiftToDelete.date,
        startTime: shiftToDelete.startTime,
        endTime: shiftToDelete.endTime,
        mode,   // 🔑 esto se mandará al backend
      },
    ]);

    // 🖊️ Preview visual de borrado
    setEditingPreview({
      type: 'DELETE',
      day: shiftToDelete.day,
      startTime: shiftToDelete.startTime,
      endTime: shiftToDelete.endTime,
    });

    setShowShiftDeleteConfirm(false);
    setShiftToDelete(null);
    setDeleteShiftMode('ONLY_THIS_BLOCK');
  }
  async function handleConfirmDeleteVacation() {
    if (!vacationToDelete || !scheduleId) return;

    const token = localStorage.getItem('token');

    // 🔑 decidir modo según checkbox
    let mode = null;

    if (deleteVacationSingle) mode = 'single';
    if (deleteVacationForward) mode = 'forward';

    if (!mode) {
      alert('Debes seleccionar una opción de borrado');
      return;
    }

    console.log('🟡 BORRANDO VACACIONES EN BACKEND:', {
      date: vacationToDelete.date,
      mode,
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/${scheduleId}/vacations`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: vacationToDelete.date,
            mode,
          }),
        }
      );

      const text = await res.text();
      console.log('⬅️ RESPUESTA DELETE VACATIONS:', res.status, text || '(empty)');

      if (!res.ok) {
        throw new Error(text || 'Error borrando vacaciones');
      }

      // 🧹 ACTUALIZAR ESTADO LOCAL (QUITAR DEL DIBUJO)
      setVacations(prev => {
        if (mode === 'single') {
          return prev.filter(v => v.date !== vacationToDelete.date);
        } else {
          // forward → borrar desde ese día en adelante
          return prev.filter(v => v.date < vacationToDelete.date);
        }
      });

      // 🔚 CERRAR POPUPS
      setShowVacationMode(false);
      setVacationToDelete(null);

    } catch (err) {
      console.error('❌ ERROR BORRANDO VACACIONES', err);
      alert(err.message || 'Error borrando vacaciones');
    }
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

  async function handleConfirmEditShift() {
    if (!editingShift || !scheduleId) return;

    console.log('💾 CONFIRMANDO EDICIÓN DE TURNO:', {
      old: editingShift,
      newStart: startTime,
      newEnd: endTime,
    });

    const token = localStorage.getItem('token');

    try {
      // 1️⃣ BORRAR TURNO ANTIGUO (solo este bloque)
      const deleteRes = await fetch(
        `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/${scheduleId}/shifts`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'CALENDAR',
            mode: 'ONLY_THIS_BLOCK',
            dateFrom: editingShift.date,
            startTime: editingShift.startTime,
            endTime: editingShift.endTime,
          }),
        }
      );

      if (!deleteRes.ok) {
        const text = await deleteRes.text();
        throw new Error('Error borrando turno antiguo: ' + text);
      }

      console.log('🗑️ TURNO ANTIGUO BORRADO OK');

      // 2️⃣ CREAR TURNO NUEVO EDITADO
      await saveTurnToBackend(scheduleId, {
        days: [editingShift.day],
        startTime,
        endTime,
      });

      console.log('🟢 TURNO EDITADO GUARDADO OK');
      // 🔑 ACTUALIZAR savedTurns EN MEMORIA PARA REFLEJAR LA EDICIÓN
      setSavedTurns(prev =>
        prev
          // 1️⃣ Quitamos el turno antiguo (el que acabamos de editar)
          .filter(t =>
            !(
              t.startTime === editingShift.startTime &&
              t.endTime === editingShift.endTime &&
              t.days.includes(editingShift.day)
            )
          )
          // 2️⃣ Añadimos el nuevo turno editado
          .concat([{
            id: 'edited-local',          // solo frontend
            days: [editingShift.day],
            startTime: startTime,        // nuevo inicio
            endTime: endTime,            // nuevo fin
          }])
      );
      // 3️⃣ LIMPIAR MODO EDICIÓN
      setEditingShift(null);
      setEditingPreview(null);
      setSelectedDays([]);
      setStartTime('');
      setEndTime('');

      // 🔓 QUITAR ATENUACIÓN
      // (editingShift = null ya quita editing-mode)

    } catch (err) {
      console.error('❌ ERROR EN EDICIÓN DE TURNO', err);
      alert(err.message || 'Error editando turno');
    }
  }

  async function saveTurnToBackend(scheduleId, turn) {
    const token = localStorage.getItem('token');

    // 🔑 FECHAS QUE VIENEN DEL PANEL SUPERIOR
    // dateFrom y dateTo ya existen en tu estado
    const fromDate = dateFrom;                // obligatorio
    const toDate = dateTo || null;             // puede ser null

    if (!fromDate) {
      throw new Error('No hay fecha de inicio (dateFrom) para el turno');
    }

    for (const day of turn.days) {
      const weekdayNumber = weekDays.indexOf(day) + 1;

      console.log('➡️ POST TURN:', {
        day,
        weekday: weekdayNumber,
        startTime: turn.startTime,
        endTime: turn.endTime,
        validFrom: fromDate,
        validTo: toDate,
      });

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/${scheduleId}/shifts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            weekday: weekdayNumber,
            startTime: turn.startTime,
            endTime: turn.endTime,
            validFrom: fromDate,   // 👈 CLAVE
            validTo: toDate,       // 👈 CLAVE (null o fecha)
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error('❌ ERROR BACKEND ADD SHIFT:', text);
        throw new Error(`Error guardando turno ${day}: ${text}`);
      }

      const created = await res.json();
      console.log('🟢 TURNO GUARDADO OK:', created);
    }
  }

  // 🖊️ Calcula qué tramo se añade o se borra al editar un turno
  function updateEditingPreview(newStart, newEnd) {
    if (!editingShift) return;

    const oldStart = editingShift.startTime;
    const oldEnd = editingShift.endTime;

    const toMin = t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const oStart = toMin(oldStart);
    const oEnd = toMin(oldEnd);
    const nStart = toMin(newStart);
    const nEnd = toMin(newEnd);

    let preview = null;

    // 🔴 SE BORRA FINAL
    if (nEnd < oEnd) {
      preview = {
        type: 'DELETE',
        day: editingShift.day,
        startTime: newEnd,
        endTime: oldEnd,
      };
    }

    // 🔴 SE BORRA INICIO
    else if (nStart > oStart) {
      preview = {
        type: 'DELETE',
        day: editingShift.day,
        startTime: oldStart,
        endTime: newStart,
      };
    }

    // 🟢 SE AÑADE FINAL
    else if (nEnd > oEnd) {
      preview = {
        type: 'ADD',
        day: editingShift.day,
        startTime: oldEnd,
        endTime: newEnd,
      };
    }

    // 🟢 SE AÑADE INICIO
    else if (nStart < oStart) {
      preview = {
        type: 'ADD',
        day: editingShift.day,
        startTime: newStart,
        endTime: oldStart,
      };
    }

    setEditingPreview(preview);
  }

  async function completeSchedule() {
    const token = localStorage.getItem('token');

    console.log('▶️ completeSchedule START', {
      scheduleId,
      turns: turns.length,
      vacations: vacations.length,
      draftExceptions: draftExceptions.length,
    });

    let activeScheduleId = scheduleId;

    // 🔑 SI NO HAY HORARIO ACTIVO → CREAR BORRADOR PRIMERO
    if (!activeScheduleId) {
      console.log('🆕 NO HAY SCHEDULE → CREANDO DRAFT');

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
        console.error('❌ ERROR creando schedule draft:', text);
        alert('Error creando horario');
        return;
      }

      const newSchedule = await res.json();

      console.log('🟢 SCHEDULE DRAFT CREADO:', newSchedule.id);

      activeScheduleId = newSchedule.id;
      setScheduleId(newSchedule.id);
    }

    const draftTurnsSafe = Array.isArray(draftTurns) ? draftTurns : [];
    const draftVacations = vacations.filter(v => v.source === 'draft');

    try {
      setSaving(true);
      let id = activeScheduleId;

      // =========================
      // 1️⃣ BORRAR TURNOS EDITADOS (removedTurns) EN BACKEND
      // =========================
      console.log('🗑️ borrando turnos editados en backend:', removedTurns.length);
      // (Aquí ahora mismo no haces nada, lo dejamos como está)

      // =========================
      // 2️⃣ TURNOS NUEVOS / EDITADOS
      // =========================
      console.log('🟡 guardando turnos:', draftTurnsSafe.length);

      for (const turn of draftTurnsSafe) {
        await saveTurnToBackend(activeScheduleId, turn);
      }

      // =========================
      // 3️⃣ VACACIONES (DÍAS SUELTOS)
      // =========================
      for (const v of draftVacations) {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/${id}/vacations`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: v.date }),
          }
        );

        const text = await res.text();

        console.log('⬅️ VACATION SAVE RESPONSE:', res.status, text || '(empty)');

        if (!res.ok) {
          throw new Error(`Error guardando vacaciones (${v.date}): ${text}`);
        }
      }

      // =========================
      // 4️⃣ 🟥 GUARDAR EXCEPCIONES DE TURNO (BORRADOS / MODIFIED_SHIFT)
      // =========================
      if (draftExceptions.length > 0) {
        console.log('🟥 guardando excepciones de turno:', draftExceptions.length);
        console.log('🟦 FRONTEND EXCEPTIONS TO BACKEND:', draftExceptions.map(ex => ({
          type: ex.type,
          date: ex.date,
          //day: ex.day,
          startTime: ex.startTime,
          endTime: ex.endTime,
          mode: ex.mode,
        })));
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/${id}/exceptions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              exceptions: draftExceptions.map(ex => ({
                type: ex.type,            // 'MODIFIED_SHIFT'
                date: ex.date,
                //day: ex.day,           // '2026-01-27'
                startTime: ex.startTime, // '09:00'
                endTime: ex.endTime,     // '11:00'
                mode: ex.mode,           // ONLY_THIS_BLOCK / FROM_THIS_DAY_ON
              })),
            }),
          }
        );

        const text = await res.text();
        console.log('⬅️ EXCEPTIONS SAVE RESPONSE:', res.status, text || '(empty)');

        if (!res.ok) {
          throw new Error(`Error guardando excepciones de turno: ${text}`);
        }
      }

      // =========================
      // 5️⃣ CONFIRMAR HORARIO (SI HAY CUALQUIER CAMBIO REAL)
      // =========================

      const hasAnyChange =
        draftTurnsSafe.length > 0 ||
        draftVacations.length > 0 ||
        draftExceptions.length > 0;

      if (hasAnyChange) {
        console.log('🟡 confirmando horario...');

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
      } else {
        console.log('ℹ️ Horario sin cambios reales: no se confirma');
      }

      console.log('✅ TODO OK — saliendo');
      setDraftTurns([]);
      setDraftExceptions([]);   // 🔑 importante limpiar excepciones
      window.history.back();

    } catch (err) {
      console.error('❌ ERROR EN completeSchedule', err);
      alert(err.message || 'Error guardando horario');
    } finally {
      setSaving(false);
    }
  }


  const savedTurns = turns.map(t => ({ ...t, source: 'saved' }));
  const mergedDraftTurns = draftTurns.map(t => ({ ...t, source: 'draft' }));


  // VACACIONES VISUALES (por día exacto)
  // =========================
  const weekVacationBlocks = [];
  //console.log('📅 SEMANA EN PANTALLA:', weekDates.map(d => d.toISOString().slice(0, 10)));

  vacations.forEach((v, index) => {
    const day = new Date(v.date + 'T00:00:00');

    weekDates.forEach((date, colIndex) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      if (day >= dayStart && day <= dayEnd) {
        //console.log('   ✅ COINCIDE → se dibuja en columna', colIndex + 1);
        weekVacationBlocks.push({
          date: v.date,
          col: colIndex + 1,
          source: v.source,
          key: `vac-${index}-${colIndex}`,
        });
      }
    });
    //console.log('🟢 BLOQUES DE VACACIONES GENERADOS:', weekVacationBlocks);
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
      <div className="employee-header layout-width">
        {employee?.photoUrl && (
          <img
            src={employee.photoUrl}
            alt="Empleado"
            className="employee-photo"
          />
        )}

        <div className="employee-texts">
          <div className="company-name">
            {company?.commercialName || 'Empresa'}
          </div>

          <div className="employee-name">
            {employee
              ? `${employee.name} ${employee.firstSurname}`
              : 'Empleado'}
          </div>
        </div>
      </div>

      <div className="form-card layout-width">

        {/* DAYS — CABECERA DEL PANEL (PEGADA) */}
        <div className="days-selector">
          {days.map(d => (
            <label key={d.key} className="day-checkbox">
              <input
                type="checkbox"
                checked={selectedDays.includes(d.key)}
                onChange={() => toggleDay(d.key)}
              />
              {d.key === 'X' ? 'X' : d.label[0]}
            </label>
          ))}
        </div>


        {/* PANEL DE CONTROLES */}
        <div className={`controls-panel ${editingShift ? '' : ''}`}>

          {/* FECHAS + HORAS (DOS SUBCOLUMNAS) */}
          <div className="form-row">

            {/* COLUMNA IZQUIERDA — FECHAS */}
            <div className="form-dates">
              <div className="caption">Fecha inicio</div>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="date-input"
              />

              <div className="caption">Fecha fin</div>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="date-input"
              />
            </div>

            {/* COLUMNA DERECHA — HORAS + BOTONES DE TURNO */}
            <div className="form-times">

              <div className="caption">Entrada</div>
              <div className="time-row">
                <select
                  value={startTime}
                  onChange={e => {
                    const newStart = e.target.value;
                    setStartTime(newStart);

                    if (editingShift) {
                      setEditingPreview({
                        ...editingShift,
                        startTime: newStart,
                        endTime,
                      });
                    }
                  }}
                  className="time-input in-select"
                >
                  <option value="">Hora de entrada</option>
                  {timeOptions.map(t => (
                    <option key={t} value={t}>
                      {t} IN
                    </option>
                  ))}
                </select>
              </div>
              <div className="caption">Salida</div>
              <div className="time-row">
                <select
                  value={endTime}
                  onChange={e => {
                    const newEnd = e.target.value;
                    setEndTime(newEnd);

                    if (editingShift) {
                      setEditingPreview({
                        ...editingShift,
                        startTime,
                        endTime: newEnd,
                      });
                    }
                  }}
                  className="time-input out select"
                >
                  <option value="">Hora de salida</option>
                  {timeOptions.map(t => (
                    <option key={t} value={t}>
                      {t} OUT
                    </option>
                  ))}
                </select>
              </div>

              {/* 👇 AQUÍ VAN AHORA LOS DOS BOTONES */}
              <div className="form-inline-buttons">
                <button
                  className="primary-button delete-block"
                  onClick={handleDeleteBlock}
                >
                  Borrar bloque
                </button>

                <button
                  onClick={() => {
                    // SIEMPRE solo frontend
                    addTurn();
                  }}
                  className="primary-button add-turn"
                >
                  Añadir turno
                </button>
              </div>

            </div>
          </div>

          {/* FILA INFERIOR — VACACIONES + COMPLETADO */}
          <div className="form-buttons-row">
            <button
              onClick={addVacation}
              className="primary-button add-vacation full-width"
            >
              Añadir vacaciones
            </button>

            <button
              onClick={completeSchedule}
              className="complete-button full-width"
            >
              Confirmar horario
            </button>
            {deleteConfirmStep && (
              <div className="delete-confirm">
                <p>{deleteSummary}</p>

                <div className="form-inline-buttons">
                  <button
                    className="primary-button delete-block"
                    onClick={() => {
                      // 👉 aquí irá luego el borrado real
                      alert('Borrado confirmado (pendiente de backend)');
                      setDeleteConfirmStep(null);
                    }}
                  >
                    Confirmar
                  </button>

                  <button
                    className="primary-button"
                    onClick={() => setDeleteConfirmStep(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WEEKLY CALENDAR */}
      <div className="calendar-wrapper layout-width">

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
                  return normalizeToWeekStart(prev);
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
                  return normalizeToWeekStart(next);
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
                setWeekStart(normalizeToWeekStart(d));
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
                setWeekStart(normalizeToWeekStart(d));
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
        <div className={`calendar-grid-wrapper ${editingShift ? 'editing-mode' : ''}`}>

          {/* HEADER DÍAS — scroll horizontal */}
          <div
            ref={headerXRef}
            className={`calendar-header-x ${calendarFocused ? 'focused' : ''}`} // 👈 CAMBIO
            onMouseDown={() => setCalendarFocused(true)}
          >
            <div className="calendar-days-header">

              {/* 🔹 CELDA VACÍA PARA ALINEAR CON LA COLUMNA DE HORAS */}
              <div />

              {/* 🔹 CABECERAS DE LOS 7 DÍAS */}
              {weekDates.map((date, i) => (
                <div key={i} className="calendar-day-header">
                  {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                </div>
              ))}
            </div>
          </div>

          {/* CUERPO */}
          <div className="calendar-body">

            {/* GRID + HORAS — scroll vertical */}
            <div
              ref={calendarRef}
              onMouseDown={() => setCalendarFocused(true)}
              className={`calendar-scroll ${calendarFocused ? 'focused' : ''}`}
            >

              {/* HORAS — fuera del grid, dentro del scroll vertical */}
              <div className="calendar-hours-y" ref={hoursRef}>
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="hour-label">
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* GRID */}
              <div className="calendar-grid calendar-grid-rows">

                {/* CELDAS */}
                {Array.from({ length: 48 }).map((_, row) =>
                  weekDays.map((_, col) => (
                    <div
                      key={`${row}-${col}`}
                      className="calendar-cell"
                      style={{
                        gridColumn: col + 1,
                        gridRow: row + 1,
                      }}
                    />
                  ))
                )}

                {weekVacationBlocks.map(v => (
                  <div
                    key={v.key}
                    className={`vacation ${v.source === 'draft' ? 'draft' : ''}`}
                    style={{
                      gridColumn: v.col,
                      gridRow: '1 / 49',
                    }}
                    onMouseDown={e => {
                      // 🔑 CLAVE: evitamos que el grid robe el foco
                      e.stopPropagation();
                    }}
                    onClick={e => {
                      e.stopPropagation();

                      //console.log('🟥 CLICK EN BLOQUE DE VACACIONES', v);
                      //console.log('📅 Fecha clicada (REAL):', v.date);

                      setVacationToDelete({ date: v.date });   // 🔑 USAMOS LA FECHA REAL
                      setShowVacationConfirm(true);            // 👉 POPUP 1
                      //console.log('🟣 showVacationConfirm = true');
                    }}
                  >
                    Vacaciones
                  </div>
                ))}

                {/* TURNOS GUARDADOS (REALES, BORRABLES) */}
                {savedTurns.map((t, i) =>
                  t.days.map(day => {
                    const col = weekDays.indexOf(day) + 1;

                    console.log('🎯 DIBUJANDO TURNO:', {
                      day,
                      indexInWeekDays: weekDays.indexOf(day),
                      colCalculada: col,
                      fechaColumna: weekDates[col - 1].toISOString().slice(0, 10),
                      removedTurns,
                    });



                    const start = timeToRow(t.startTime);
                    let end = timeToRow(t.endTime);
                    if (end <= start) end += 48;

                    const currentDate = weekDates[col - 1].toISOString().slice(0, 10);

                    // 🔴 SI HAY UNA EXCEPCIÓN DE BORRADO PARA ESTE TURNO, NO LO DIBUJAMOS
                    const isRemovedByException = draftExceptions.some(ex =>
                      ex.type === 'MODIFIED_SHIFT' &&
                      //ex.day === day &&
                      ex.startTime === t.startTime &&
                      ex.endTime === t.endTime &&
                      ex.date === currentDate &&
                      ex.mode === 'ONLY_THIS_BLOCK'
                    );

                    if (isRemovedByException) {
                      console.log('🟥 TURNO OCULTO POR EXCEPCIÓN:', {
                        day,
                        startTime: t.startTime,
                        endTime: t.endTime,
                        date: currentDate,
                      });
                      return null;
                    }

                    console.log('🟣 CHECK PREVIEW VS TURNO', {
                      editingPreview,
                      turno: {
                        day,
                        startTime: t.startTime,
                        endTime: t.endTime,
                        date: currentDate,
                      }
                    });

                    // 🔴 NO dibujar si este turno está siendo borrado en preview
                    if (
                      editingPreview &&
                      editingPreview.type === 'DELETE' &&
                      editingPreview.day === day &&
                      editingPreview.startTime === t.startTime &&
                      editingPreview.endTime === t.endTime
                    ) {
                      console.log('🟥 TURNO OCULTO POR PREVIEW DELETE', {
                        day,
                        startTime: t.startTime,
                        endTime: t.endTime,
                        date: currentDate,
                      });
                      return null;
                    }
                    return (
                      <div
                        key={`saved-${t.id}-${day}`}
                        className={`turn-saved ${editingShift &&
                          editingShift.day === day &&
                          editingShift.startTime === t.startTime &&
                          editingShift.endTime === t.endTime
                          ? 'editing-highlight'
                          : ''
                          }`}
                        style={{
                          gridColumn: col,
                          gridRow: `${start + 1} / ${end + 1}`,
                        }}

                        // 🔑 EVITAR QUE EL GRID ROBE EL FOCO
                        onMouseDown={e => {
                          e.stopPropagation();
                        }}
                        onClick={e => {
                          e.stopPropagation();

                          console.log('🟥 CLICK EN TURNO GUARDADO REAL', {
                            id: t.id,
                            day,
                            startTime: t.startTime,
                            endTime: t.endTime,
                          });

                          // 👉 SOLO abrimos el popup de opciones
                          setShiftToDelete({
                            id: t.id,
                            day,
                            date: weekDates[col - 1].toISOString().slice(0, 10),
                            startTime: t.startTime,
                            endTime: t.endTime,
                          });

                          setDeleteShiftMode('ONLY_THIS_BLOCK');
                          setShowShiftDeleteConfirm(true);
                        }}
                      >
                        {t.startTime} – {t.endTime}
                      </div>
                    );
                  })
                )}

                {/* ✏️ PREVIEW DE EDICIÓN SOLO PARA ADD / EDIT */}
                {editingPreview && editingPreview.type !== 'DELETE' && (
                  (() => {
                    const col = weekDays.indexOf(editingPreview.day) + 1;
                    const start = timeToRow(editingPreview.startTime);
                    let end = timeToRow(editingPreview.endTime);
                    if (end <= start) end += 48;

                    return (
                      <div
                        className="turn-draft editing-highlight"
                        style={{
                          gridColumn: col,
                          gridRow: `${start + 1} / ${end + 1}`,
                          background: '#22c55e',
                          opacity: 0.7,
                        }}
                      >
                        {editingPreview.startTime} – {editingPreview.endTime}
                      </div>
                    );
                  })()
                )}

                {/* 🖊️ PREVIEW DE EDICIÓN */}
                {editingPreview && (
                  <div
                    className={`turn-preview ${editingPreview.type === 'ADD' ? 'preview-add' : 'preview-delete'
                      }`}
                    style={{
                      gridColumn: weekDays.indexOf(editingPreview.day) + 1,
                      gridRow: `${timeToRow(editingPreview.startTime) + 1} / ${timeToRow(editingPreview.endTime) + 1
                        }`,
                    }}
                  >
                    {editingPreview.startTime} – {editingPreview.endTime}
                  </div>
                )}

                {/* TURNOS BORRADOR */}
                {mergedDraftTurns.map((t, i) =>
                  t.days.map(day => {
                    const col = weekDays.indexOf(day) + 1;
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

      <datalist id="time-options">
        {timeOptions.map(t => (
          <option key={t} value={t} />
        ))}
      </datalist>
      {/* 🗑️ POP-UP 1 — CONFIRMACIÓN INICIAL VACACIONES */}
      {showVacationConfirm && vacationToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Vacaciones</h3>

            <p>
              Vacaciones el día{' '}
              <strong>
                {new Date(vacationToDelete.date).toLocaleDateString('es-ES')}
              </strong>
            </p>

            <div className="modal-buttons">
              <button
                onClick={() => {
                  setShowVacationConfirm(false);
                  setVacationToDelete(null);
                }}
              >
                Cancelar
              </button>

              <button
                className="delete-block"
                onClick={() => {
                  // Pasamos al segundo popup
                  setShowVacationConfirm(false);
                  setShowVacationMode(true);

                  // reset checks
                  setDeleteVacationSingle(true);
                  setDeleteVacationForward(false);
                }}
              >
                Borrar vacaciones
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 🗑️ POP-UP 2 — MODO DE BORRADO VACACIONES */}
      {showVacationMode && vacationToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Borrar vacaciones</h3>

            <p>
              ¿Qué quieres borrar desde el día{' '}
              <strong>
                {new Date(vacationToDelete.date).toLocaleDateString('es-ES')}
              </strong>
              ?
            </p>

            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={deleteVacationSingle}
                  onChange={e => {
                    setDeleteVacationSingle(e.target.checked);
                    if (e.target.checked) setDeleteVacationForward(false);
                  }}
                />{' '}
                Borrar solo este día
              </label>

              <label style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  checked={deleteVacationForward}
                  onChange={e => {
                    setDeleteVacationForward(e.target.checked);
                    if (e.target.checked) setDeleteVacationSingle(false);
                  }}
                />{' '}
                Borrar todas las vacaciones desde este día en adelante
              </label>
            </div>

            <div className="modal-buttons" style={{ marginTop: '16px' }}>
              <button
                onClick={() => {
                  setShowVacationMode(false);
                  setVacationToDelete(null);
                }}
              >
                Cancelar
              </button>

              <button
                className="delete-block"
                onClick={handleConfirmDeleteVacation}
              >
                Confirmar borrado
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 🗑️ POP-UP — OPCIONES TURNO */}
      {showShiftDeleteConfirm && shiftToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Turno</h3>

            <p>
              Turno del día{' '}
              <strong>{shiftToDelete.day}</strong>{' '}
              de{' '}
              <strong>
                {shiftToDelete.startTime} – {shiftToDelete.endTime}
              </strong>
            </p>

            {/* 🔽 NUEVA SECCIÓN: SELECCIÓN DE MODO */}
            <div className="delete-modes">
              <label>
                <input
                  type="radio"
                  name="deleteMode"
                  value="ONLY_THIS_BLOCK"
                  checked={deleteShiftMode === 'ONLY_THIS_BLOCK'}
                  onChange={() => setDeleteShiftMode('ONLY_THIS_BLOCK')}
                />
                <strong>Solo este turno</strong>
                <div className="hint">
                  El borrado se aplicará únicamente a este día.
                </div>
              </label>

              <label>
                <input
                  type="radio"
                  name="deleteMode"
                  value="FROM_THIS_DAY_ON"
                  checked={deleteShiftMode === 'FROM_THIS_DAY_ON'}
                  onChange={() => setDeleteShiftMode('FROM_THIS_DAY_ON')}
                />
                <strong>Desde este día en adelante</strong>
                <div className="hint">
                  El turno desaparecerá de todos los días futuros.
                </div>
              </label>
            </div>

            {/* 🔘 BOTONES */}
            <div className="modal-buttons" style={{ justifyContent: 'space-between' }}>
              {/* 🖊️ EDITAR */}
              <button
                onClick={() => {
                  setShowShiftDeleteConfirm(false);
                  setShowEditInfo(true);
                }}
              >
                ✏️ Editar turno
              </button>

              {/* 🗑️ CONFIRMAR BORRADO */}
              <button
                className="delete-block"
                onClick={handleConfirmDeleteShift}
              >
                Confirmar borrado
              </button>

              <button
                onClick={() => {
                  setShowShiftDeleteConfirm(false);
                  setShiftToDelete(null);
                  setDeleteShiftMode('ONLY_THIS_BLOCK');
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ POP-UP — MODO EDICIÓN DE TURNO */}
      {showEditInfo && shiftToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Editar turno</h3>

            <p>
              Edita el turno en el panel superior y pulsa en{' '}
              <strong>Añadir turno</strong>.<br /><br />
              Cuando termines todos los cambios del horario, pulsa en{' '}
              <strong>Confirmar horario</strong>.
            </p>

            <div className="modal-buttons">
              <button
                onClick={() => {
                  // 🔔 AQUÍ empieza de verdad la edición

                  setEditingShift(shiftToDelete);
                  setSelectedDays([shiftToDelete.day]);
                  setStartTime(shiftToDelete.startTime);
                  setEndTime(shiftToDelete.endTime);
                  setDateFrom(shiftToDelete.date);
                  setDateTo('');

                  setEditingPreview(null);

                  setShowEditInfo(false);
                }}
              >
                Aceptar
              </button>

              <button
                onClick={() => {
                  // cancelar edición antes de empezar
                  setShowEditInfo(false);
                  setShiftToDelete(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  {
    showVacationConfirm && (
      alert('POPUP 1 DEBERÍA SALIR — showVacationConfirm = true')
    )
  }
}