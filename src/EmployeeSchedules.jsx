import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import './EmployeeSchedules.css';
import CalendarGrid from './CalendarGrid';
import {
  timeToRow,
  formatDateLocal,
  normalizeToWeekStart,
  minutesBetween,
  normalizeTime,
  timeToMinutes,
  minutesToTime,
  diffDays,
} from './calendar.time';
import { useCalendarData } from './useCalendarData';

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

const weekDays = [null, 'L', 'M', 'X', 'J', 'V', 'S', 'D'];
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

function ensureShiftId(turn) {

  if (!turn) return turn;

  if (!turn.shiftId && turn.source === 'saved') {
    console.error('⚠️ SHIFT SIN ID DETECTADO', turn);
  }
  return turn;
}

function buildFinalDayBlocks({
  date,
  backendDays,
  draftTurns,
  action,
}) {

  console.log('🧠 buildFinalDayBlocks INPUT', { date, action });

  // ======================================================
  // 1️⃣ SACAR DÍA DEL BACKEND
  // ======================================================
  const dayData = backendDays.find(d => d.date === date);

  const patternTurns = dayData?.patternTurns || [];
  const finalTurns = dayData?.turns || [];
  const hasException = dayData?.hasException === true;

  // ======================================================
  // 2️⃣ BASE DEL DÍA
  // ======================================================
  let baseBlocks;

  const existingDraft = draftTurns.find(d =>
    d.type === 'SET_DAY' && d.date === date
  );

  if (existingDraft) {
    console.log('🟡 BASE DESDE DRAFT');

    baseBlocks = existingDraft.blocks.map(b => ({
      startTime: b.startTime,
      endTime: b.endTime,
      edited: b.edited ?? false,
    }));

  } else if (hasException) {
    console.log('🟠 BASE DESDE SNAPSHOT (backend)');

    baseBlocks = finalTurns.map(t => ({
      startTime: t.startTime,
      endTime: t.endTime,
      edited: false,
    }));

  } else {
    console.log('🟢 BASE DESDE PATRÓN');

    baseBlocks = patternTurns.map(t => ({
      startTime: t.startTime,
      endTime: t.endTime,
      edited: false,
    }));
  }

  console.log('🧱 BASE BLOCKS', baseBlocks);

  // ======================================================
  // 3️⃣ APLICAR EDIT (B3 o A2)
  // ======================================================
  if (action?.type === 'edit') {

    const { startTime, endTime } = action;

    console.log('✏️ APLICANDO EDIT', { startTime, endTime });

    const cleaned = baseBlocks.filter(b =>
      !(b.startTime === action.originalStartTime &&
        b.endTime === action.originalEndTime)
    );

    const next = [
      ...cleaned,
      {
        startTime,
        endTime,
        edited: true,
      }
    ];

    console.log('🧱 AFTER EDIT', next);

    return next;
  }

  return baseBlocks;
}

function buildWeekVacationBlocks(days, weekDates) {

  return days
    .filter(d => d.isVacation)
    .map(d => {

      const col = weekDates.findIndex(date =>
        date === d.date
      );

      if (col === -1) return null;

      return {
        key: `vac-${d.date}`,
        col,
        date: d.date,
        source: 'backend',
      };
    })
    .filter(Boolean);
}

export default function EmployeeSchedules() {
  const { companyId, employeeId } = useParams();
  const headerXRef = useRef(null);
  const calendarRef = useRef(null);
  useEffect(() => {
    if (!calendarRef.current) return;

    const HOUR_HEIGHT = 48; // 1h = 48px (2 filas de 24px)
    const START_HOUR = 8;

    calendarRef.current.scrollTop = START_HOUR * HOUR_HEIGHT;
  }, []);
  const hoursRef = useRef(null);
  const [showPanel, setShowPanel] = useState(false);
  /* 🆕 DATOS CABECERA */

  const [company, setCompany] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [backendDays, setBackendDays] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState('');
  const [turns, setTurns] = useState([]);
  const [patternShifts, setPatternShifts] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [vacationMode, setVacationMode] = useState(false);
  const [draftTurns, setDraftTurns] = useState([]);
  // 🟢 MODO EDICIÓN DE TURNO
  const [editingShift, setEditingShift] = useState(null);

  // 🗑️ BORRADO DE VACACIONES (UX)
  const [vacationToDelete, setVacationToDelete] = useState(null);


  // { shiftId, day, startTime, endTime }
  const [showShiftDeleteConfirm, setShowShiftDeleteConfirm] = useState(false);
  const [deleteShiftMode, setDeleteShiftMode] = useState('ONLY_THIS_BLOCK');

  const [calendarDays, setCalendarDays] = useState([]);

  const [showVacationConfirm, setShowVacationConfirm] = useState(false);
  const [showVacationMode, setShowVacationMode] = useState(false);

  const [deleteVacationSingle, setDeleteVacationSingle] = useState(true);
  const [deleteVacationForward, setDeleteVacationForward] = useState(false);
  const [scheduleId, setScheduleId] = useState(null);

  // 🗑️ BORRADO DE TURNOS (UX)
  const [shiftToDelete, setShiftToDelete] = useState(null);
  // 🗑️ BORRADO DE TURNOS (UX)
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(null); // null | 1 | 2
  const [deleteSummary, setDeleteSummary] = useState('');
  //    EDITADO DE TURNOS (UX) 
  const [editShiftMode, setEditShiftMode] = useState('ONLY_THIS_BLOCK');


  // 🟠 CAMBIOS DEL USUARIO
  const [hasChanges, setHasChanges] = useState(false);
  const navigate = useNavigate();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!hasUnsavedChanges) return;

      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // 📅 Semana actual (lunes)
  const [weekStart, setWeekStart] = useState(() => normalizeToWeekStart(new Date()));
  const [saving, setSaving] = useState(false);

  const ROW_HEIGHT = 24;
  const INITIAL_SCROLL_HOUR = 8;
  const [calendarFocused, setCalendarFocused] = useState(false);
  const weekDates = useMemo(() => {
    if (!weekStart) return [];

    const result = [null]; // índice 0 no se usa

    for (let weekday = 1; weekday <= 7; weekday++) {
      const d = new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        weekStart.getDate() + (weekday - 1)
      );
      result[weekday] = d;
    }

    return result; // usamos solo 1..7
  }, [weekStart]);

  console.log(
    '🧪 DEBUG weekDates CALCULADAS:',
    weekDates.slice(1).map(d => formatDateLocal(d))
  );

  console.log('🧪 STATE draftTurns', draftTurns);
  useEffect(() => {
    if (!editingShift) return;

    console.log('🧪 ABRIENDO PANEL DE EDICIÓN', editingShift);
    setShowPanel(true);

    setStartTime(editingShift.startTime);
    setEndTime(editingShift.endTime);
    setSelectedDays([editingShift.day]);
    setDateFrom(editingShift.date);
    setDateTo(editingShift.date);

  }, [editingShift]);


  async function reloadActiveSchedule() {

    // 🛑 BLINDAJE
    if (!employee || !employee.branchId || !employeeId) {
      console.log('⏸️ reloadActiveSchedule cancelado: employee no listo aún');
      return;
    }

    try {

      const token = localStorage.getItem('token');
      const weekStartStr = formatDateLocal(weekStart);

      console.log('📅 reloadActiveSchedule → semana:', weekStartStr);

      const scheduleRes = await fetch(
        `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/user/${employeeId}/active?weekStart=${weekStartStr}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!scheduleRes.ok) {
        console.warn('⚠️ Error cargando semana activa');
        setTurns([]);
        setVacations([]);
        setScheduleId(null);
        setBackendDays([]); // 🔥 importante
        return;
      }

      const schedule = await safeJson(scheduleRes);

      console.log('🧪 RAW DAYS FROM BACKEND', schedule?.days);

      // ======================================================
      // 🔥 CLAVE: guardar días completos del backend
      // ======================================================
      setBackendDays(schedule?.days || []);

      // ======================================================
      // 🔑 limpiar estado
      // ======================================================
      const loadedTurns = [];
      const loadedVacations = [];

      if (schedule && Array.isArray(schedule.days)) {

        schedule.days.forEach(day => {

          console.log('🧪 DAY COMPLETO BACKEND', day);

          const dayKey = weekDays[day.weekday];

          // ======================================================
          // 🔴 DAY_OFF (VACACIONES)
          // ======================================================
          if (day.isVacation === true) {

            loadedVacations.push({
              date: day.date,
              type: 'DAY_OFF',
              source: 'backend',
            });

            return;
          }

          // ======================================================
          // 🟠 MODIFIED_SHIFT (día con excepción)
          // ======================================================
          if (day.hasException === true) {

            loadedVacations.push({
              date: day.date,
              type: 'MODIFIED',
              source: 'backend',
            });
          }

          // ======================================================
          // 🟢 TURNOS (solo los finales del backend)
          // ======================================================
          if (Array.isArray(day.turns)) {

            day.turns.forEach(t => {

              const uiId = `${day.date}-${t.startTime}-${t.endTime}`;

              const turnBlock = {
                id: uiId,
                shiftId: t.id,
                days: [dayKey],
                startTime: t.startTime,
                endTime: t.endTime,
                type: t.source === 'extra' ? 'extra' : 'regular',
                source: t.source || 'saved',
                date: day.date,
                deleted: t.deleted || false,
              };

              loadedTurns.push(ensureShiftId(turnBlock));
            });
          }

        });
      }

      console.log('📊 RESULTADO FINAL SEMANA:', {
        turns: loadedTurns.length,
        vacations: loadedVacations.length,
      });

      console.log('🧪 VACATIONS FINAL', loadedVacations);
      console.log('🧪 TURNS QUE GUARDO EN STATE', loadedTurns);

      setScheduleId(schedule?.scheduleId || null);
      setTurns(loadedTurns);
      setVacations(loadedVacations);

    } catch (err) {

      console.error('❌ Error en reloadActiveSchedule', err);

      setTurns([]);
      setVacations([]);
      setScheduleId(null);
      setBackendDays([]); // 🔥 importante

    }
  }

  // 🛡️ BLINDAJE: nunca permitir edición activa si abrimos el popup de opciones
  useEffect(() => {
    if (showShiftDeleteConfirm) {
      setEditingShift(null);
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


  /* 🆕 CARGA EMPLEADO + (OPCIONAL) EMPRESA */
  useEffect(() => {

    async function loadHeaderData() {
      try {
        const token = localStorage.getItem('token');

        /* =====================================================
           👤 EMPLEADO (FUENTE PRINCIPAL)
        ===================================================== */

        const userRes = await fetch(
          `${import.meta.env.VITE_API_URL}/users/${employeeId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!userRes.ok) {
          const text = await userRes.text();
          console.error('Error cargando empleado:', text);
          return;
        }

        const foundEmployee = await safeJson(userRes);
        console.log('🔥 EMPLOYEE BACKEND:', foundEmployee);
        if (!foundEmployee) {
          console.warn('⚠️ Empleado no encontrado');
          setEmployee(null);
          return;
        }

        // ✅ SET EMPLOYEE
        setEmployee(foundEmployee);

        // 🔥 CLAVE — AQUÍ METEMOS LA EMPRESA
        if (foundEmployee.companyName) {
          setCompany({
            commercialName: foundEmployee.companyName,
          });
        }

        /* =====================================================
           📅 HORARIO ACTIVO (CRÍTICO)
        ===================================================== */
        if (foundEmployee.branchId) {

          const weekStartStr = formatDateLocal(weekStart);

          const scheduleRes = await fetch(
            `${import.meta.env.VITE_API_URL}/companies/${foundEmployee.companyId}/branches/${foundEmployee.branchId}/schedules/user/${employeeId}/active?weekStart=${weekStartStr}`,
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
            console.log('🟡 NO HAY HORARIO ACTIVO');
            setTurns([]);
            setVacations([]);
            setScheduleId(null);
            return;
          }

          console.log('🧪 SCHEDULE ACTIVO RAW:', schedule);

          // ⚠️ NO tocar lógica de turns aquí
        }

      } catch (err) {
        console.error('❌ Error cargando header (empresa / empleado)', err);
      }
    }

    loadHeaderData();

  }, [companyId, employeeId]);


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

    return turns.some(existing => {

      // 🔥 IGNORAR EL MISMO TURNO (CLAVE)
      if (
        editingShift &&
        existing.shiftId === editingShift.shiftId &&
        existing.date === editingShift.date
      ) {
        return false;
      }

      return existing.days.some(day =>
        newTurn.days.includes(day) &&
        toMinutes(existing.startTime) < newEnd &&
        (toMinutes(existing.endTime) <= toMinutes(existing.startTime)
          ? toMinutes(existing.endTime) + 1440
          : toMinutes(existing.endTime)) > newStart
      );
    });
  }

  async function addTurn() {
    if (!startTime || !endTime || selectedDays.length === 0) return;

    if (!dateFrom) {
      alert('Debes indicar una fecha de inicio');
      return;
    }

    const map = { L: 1, M: 2, X: 3, J: 4, V: 5, S: 6, D: 7 };
    const weekdays = selectedDays.map(d => map[d]);

    if (weekdays.length === 0) {
      alert('Debes seleccionar al menos un día');
      return;
    }

    // ======================================================
    // 🔵 CASO EDICIÓN DE TURNO EXISTENTE
    // ======================================================
    if (editingShift) {

      console.log('✏️ EDIT SHIFT', {
        from: editingShift,
        to: { weekdays, startTime, endTime, dateFrom }
      });

      // 🔴 DELETE backend
      const deleteOps = [{
        type: 'DELETE',
        mode: 'FROM_THIS_DAY_ON',
        fromDate: dateFrom,
        weekdays,
        startTime: editingShift.startTime,
        endTime: editingShift.endTime
      }];

      // 🔴 DELETE visual (preview gris)
      const deleteVisualOp = {
        type: 'DELETE_PREVIEW',
        mode: deleteShiftMode,
        date: deleteShiftMode === 'ONLY_THIS_BLOCK' ? dateFrom : undefined,
        fromDate: deleteShiftMode === 'FROM_THIS_DAY_ON' ? dateFrom : undefined,
        weekdays,
        startTime: editingShift.startTime,
        endTime: editingShift.endTime
      };

      // 🟢 ADD_SHIFT (nuevo modelo → 1 solo)
      const addOp = {
        type: 'ADD_SHIFT',
        weekdays,
        startTime,
        endTime,
        validFrom: dateFrom,
        validTo: null
      };

      setDraftTurns(prev => [
        ...prev,
        deleteVisualOp,
        ...deleteOps,
        addOp
      ]);

      // 🧹 LIMPIAR
      setEditingShift(null);
      setSelectedDays([]);
      setStartTime('');
      setEndTime('');
      setDateFrom('');
      setDateTo('');

      return;
    }

    // ======================================================
    // 🟢 ALTA NORMAL (MODELO NUEVO)
    // ======================================================

    console.log('➕ ADD SHIFT', {
      weekdays,
      startTime,
      endTime,
      dateFrom,
      dateTo
    });

    const newTurn = {
      type: 'ADD_SHIFT',
      weekdays,
      startTime,
      endTime,
      validFrom: dateFrom,
      validTo: dateTo && dateTo !== '' ? dateTo : null,
    };

    setDraftTurns(prev => [...prev, newTurn]);

    // 🧹 LIMPIAR FORM
    setSelectedDays([]);
    setStartTime('');
    setEndTime('');
    setDateFrom('');
    setDateTo('');
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
    console.log('🟠 ADD VACATION', { dateFrom, dateTo });
    if (!dateFrom || !dateTo) return;

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const days = [];

    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      days.push({
        date: formatDateLocal(d), // 🔑 LOCAL, NO ISO
        source: 'saved',
      });
    }

    setVacations([...vacations, ...days]);
    setDateFrom('');
    setDateTo('');
  }

  async function completeSchedule() {
    const token = localStorage.getItem('token');
    console.log('🔥🔥🔥 COMPLETE SCHEDULE NUEVO EJECUTÁNDOSE 🔥🔥🔥');
    console.log('🚀 COMPLETE SCHEDULE START', {
      scheduleId,
      draftTurns,
    });

    let activeScheduleId = scheduleId;

    try {
      setSaving(true);

      // ================================
      // 1️⃣ asegurar schedule
      // ================================
      if (!activeScheduleId) {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/companies/${employee.companyId}/branches/${employee.branchId}/schedules/draft/${employeeId}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error('Error creando horario');

        const newSchedule = await res.json();
        activeScheduleId = newSchedule.id;
        setScheduleId(newSchedule.id);
      }

      const id = activeScheduleId;

      // ================================
      // 🧠 AGRUPAR ADD_SHIFT
      // ================================
      const groupedShifts = {};

      for (const op of draftTurns) {
        if (op.type !== 'ADD_SHIFT') continue;

        const key = `${op.startTime}-${op.endTime}-${op.validFrom}-${op.validTo || 'null'}`;

        if (!groupedShifts[key]) {
          groupedShifts[key] = {
            type: 'ADD_SHIFT',
            startTime: op.startTime,
            endTime: op.endTime,
            validFrom: op.validFrom,
            validTo: op.validTo,
            weekdays: [],
          };
        }

        if (op.weekdays && op.weekdays.length > 0) {
          groupedShifts[key].weekdays.push(...op.weekdays);
        } else if (op.weekday) {
          groupedShifts[key].weekdays.push(op.weekday);
        }
      }

      const normalizedAddShifts = Object.values(groupedShifts).map(s => ({
        ...s,
        weekdays: [...new Set(s.weekdays)].sort((a, b) => a - b),
      }));

      console.log('🧠 ADD_SHIFT AGRUPADOS:', normalizedAddShifts);

      // ================================
      // 🟠 VACATIONS
      // ================================
      const vacationOps = (vacations || [])
        .filter(v => v.source !== 'backend')
        .map(v => ({
          type: 'DAY_OFF',
          date: v.date,
        }));

      // ================================
      // 2️⃣ ordenar operaciones
      // ================================
      const ordered = [
        ...draftTurns.filter(op => op.type !== 'ADD_SHIFT'),
        ...normalizedAddShifts,
        ...vacationOps,
      ];

      console.log('📦 OPS FINALES:', ordered);

      // ================================
      // 3️⃣ ejecutar operaciones
      // ================================
      for (const op of ordered) {
        // ======================================================
        // ♻️ DELETE_EXCEPTION (RESTAURAR DÍA)
        // ======================================================
        if (op.type === 'DELETE_EXCEPTION') {

          console.log('♻️ DELETE_EXCEPTION ENVIANDO', op);

          await fetch(
            `${import.meta.env.VITE_API_URL}/companies/${employee.companyId}/branches/${employee.branchId}/schedules/${id}/exceptions/${op.date}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              }
            }
          );
          continue;
        }
        // ======================================================
        // 🟡 SET_DAY (EDIT / EXCEPCIÓN)
        // ======================================================
        if (op.type === 'SET_DAY') {

          console.log('🟡 SET_DAY DETECTADO', op);

          await fetch(
            `${import.meta.env.VITE_API_URL}/companies/${employee.companyId}/branches/${employee.branchId}/schedules/${id}/exceptions`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                exceptions: [
                  {
                    type: 'MODIFIED_SHIFT',
                    date: op.date,
                    blocks: op.blocks || [],
                  }
                ]
              }),
            }
          );

          continue;
        }
        // ======================================================
        // 🔴 DELETE
        // ======================================================
        if (op.type === 'DELETE') {

          console.log('🔴 DELETE (INTERCEPTADO)', op);

          // ======================================================
          // 🟠 SOLO ESTE DÍA → EXCEPCIÓN
          // ======================================================
          if (op.mode === 'ONLY_THIS_BLOCK') {

            console.log('🟠 CONVERTIR DELETE → SET_DAY');

            const dateObj = new Date(op.date);
            const weekday = dateObj.getDay() === 0 ? 7 : dateObj.getDay();

            // 🔥 CLAVE: respetar rango de fechas
            const patternTurns = savedTurns.filter(t => {

              let parsedWeekdays = [];

              if (Array.isArray(t.weekdays)) {
                parsedWeekdays = t.weekdays;
              } else if (typeof t.weekdays === 'string') {
                parsedWeekdays = t.weekdays.split(',').map(Number);
              }

              return (
                parsedWeekdays.includes(weekday) &&
                op.date >= t.validFrom &&
                (!t.validTo || op.date <= t.validTo)
              );
            });

            const blocks = patternTurns.map(t => {
              const isDeleted =
                t.startTime === op.startTime &&
                t.endTime === op.endTime;

              return {
                startTime: t.startTime,
                endTime: t.endTime,
                deleted: isDeleted
              };
            });

            console.log('🔥 BLOCKS QUE ENVÍO:', blocks);

            await fetch(
              `${import.meta.env.VITE_API_URL}/companies/${employee.companyId}/branches/${employee.branchId}/schedules/${id}/exceptions`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  exceptions: [
                    {
                      type: 'MODIFIED_SHIFT',
                      date: op.date,
                      blocks,
                      mode: 'ONLY_THIS_BLOCK',
                    }
                  ]
                }),
              }
            );

            continue;
          }

          // ======================================================
          // 🔴 CASCADA
          // ======================================================
          console.log('🔴 DELETE CASCADA → ENVIANDO', op);

          await fetch(
            `${import.meta.env.VITE_API_URL}/companies/${employee.companyId}/branches/${employee.branchId}/schedules/${id}/shifts`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(op),
            }
          );

          continue;
        }
        // ======================================================
        // 🟢 ADD_SHIFT (PATRÓN)
        // ======================================================
        if (op.type === 'ADD_SHIFT') {

          console.log('🟢 ADD_SHIFT ENVIANDO', op);

          await fetch(
            `${import.meta.env.VITE_API_URL}/companies/${employee.companyId}/branches/${employee.branchId}/schedules/${id}/shifts`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(op),
            }
          );

          continue;
        }
        // (resto igual...)
      }

      // ================================
      // 4️⃣ confirmar
      // ================================
      if (ordered.length > 0) {
        await fetch(
          `${import.meta.env.VITE_API_URL}/companies/${employee.companyId}/branches/${employee.branchId}/schedules/${id}/confirm`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      console.log('✅ SCHEDULE GUARDADO OK');

      setDraftTurns([]);
      setHasUnsavedChanges(false); // 🔥 RESET REAL

      window.history.back();

    } catch (err) {
      console.error('❌ ERROR EN completeSchedule', err);
      alert(err.message || 'Error guardando horario');
    } finally {
      setSaving(false);
    }
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

  async function saveTurnToBackend(scheduleId, turn) {
    const token = localStorage.getItem('token');

    // 🔑 las fechas vienen del turno, no del panel global
    const fromDate = turn.validFrom;
    const toDate = turn.validTo ?? null;

    if (!fromDate) {
      throw new Error('No hay validFrom en el turno');
    }

    console.log('🧪 ADD SHIFT FECHAS (TURN)', {
      validFrom: fromDate,
      validTo: toDate,
    });

    for (const day of turn.days) {

      // weekDays = ['','L','M','X','J','V','S','D']
      const weekdayNumber = weekDays.indexOf(day); // 1..7

      if (weekdayNumber < 1 || weekdayNumber > 7) {
        console.warn('⚠️ Día inválido, se ignora:', day);
        continue;
      }

      const payload = {
        weekday: weekdayNumber,
        startTime: turn.startTime,
        endTime: turn.endTime || null,
        validFrom: fromDate,
        validTo: toDate,
      };

      console.log('➡️ POST TURN:', payload);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/companies/${companyId}/branches/${employee.branchId}/schedules/${scheduleId}/shifts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
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

  const {
    savedTurns,
  } = useCalendarData({
    shifts: turns,
    vacations,
    weekDates,
  });

  /* ======================================================
     CÁLCULO CORRECTO DE HORAS (FRONTEND)
     - Cada turno YA corresponde a un día
     - NO se multiplica por days
  ====================================================== */
  // 🔑 clave única por día + franja

  let totalMinutes = 0;

  normalizedTurns.forEach(t => {
    totalMinutes += minutesBetween(t.startTime, t.endTime);
  });

  const totalHours = Math.floor(totalMinutes / 60);
  const totalRestMinutes = totalMinutes % 60;

  //console.log('🔥 VACATIONS STATE', vacations);
  return (
    <div className="container">

      <div className="employee-header">

        {employee?.photoUrl && (
          <img
            src={employee.photoUrl}
            alt="Empleado"
            className="employee-photo"
          />
        )}

        <div className="employee-texts">
          <div className="company-name">

            {company?.commercialName || 'Horarios de empleado'}
          </div>

          <div className="employee-name">
            {employee
              ? `${employee.name} ${employee.firstSurname}`
              : 'Empleado'}
          </div>
        </div>

        <div className="employee-back">
          <button
            onClick={() => {

              if (hasUnsavedChanges) {
                const confirmLeave = window.confirm(
                  'Tienes cambios sin guardar. ¿Seguro que quieres salir?'
                );

                if (!confirmLeave) return;
              }

              navigate(-1);
            }}
          >
            ← Volver
          </button>
        </div>

      </div>

      {/* BOTONES PRINCIPALES */}

      <div className="form-buttons-row">

        <button
          onClick={() => {
            console.log('🟡 OPEN VACATION MODE');
            setVacationMode(true)
            setEditingShift(null); // importante
            setSelectedDays([]);   // limpiar días
            setStartTime('');      // limpiar horas
            setEndTime('');

            setShowPanel(true);
          }}
          className="add-vacation"
        >
          Añadir vacaciones
        </button>

        <button
          onClick={() => setShowPanel(true)}
          className="full-width"
        >
          Añadir turno
        </button>

        <button
          onClick={completeSchedule}
        >
          Confirmar horario
        </button>

      </div>



      {/* PANEL MODAL */}
      {showPanel && (

        <div
          className="modal-overlay"
          onClick={() => {
            setShowPanel(false);
            setVacationMode(false); // 🔥 reset
          }}
        >
          <div
            className="form-card"
            onClick={(e) => e.stopPropagation()}
          >

            {/* DAYS */}
            <div className="days-selector">
              {days.map(d => (
                <label key={d.key} className="day-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(d.key)}
                    onChange={() => toggleDay(d.key)}
                    disabled={vacationMode} // 🔥 bloqueo
                  />
                  {d.key === 'X' ? 'X' : d.label[0]}
                </label>
              ))}
            </div>

            {/* PANEL */}
            <div className="controls-panel">

              <div className="form-row">

                {/* FECHAS */}
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
                    disabled={editingShift?.mode === 'FROM_THIS_DAY_ON'}
                    className="date-input"
                  />

                </div>

                {/* HORAS */}
                <div className="form-times">

                  <div className="caption">Entrada</div>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="time-input"
                    disabled={vacationMode} // 🔥 bloqueo
                  />

                  <div className="caption">Salida</div>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="time-input"
                    disabled={vacationMode} // 🔥 bloqueo
                  />

                  {/* BOTONES */}
                  <div className="form-inline-buttons">

                    <button
                      onClick={() => {
                        setShowPanel(false);
                        setVacationMode(false); // 🔥 reset
                      }}
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={() => {

                        // 🔶 VACACIONES
                        if (vacationMode) {
                          console.log('🔥 CLICK ACEPTAR VACATION MODE', vacationMode);

                          addVacation();
                          setHasUnsavedChanges(true); // 🔥

                          setDateFrom('');
                          setDateTo('');
                          setVacationMode(false);
                          setShowPanel(false);
                          return;
                        }

                        console.log('🧪 selectedDays CLICK', selectedDays);

                        if (!startTime || !endTime) {
                          alert('Debes indicar hora de entrada y salida');
                          return;
                        }

                        if (endTime <= startTime) {
                          alert('La hora de salida debe ser mayor que la de entrada');
                          return;
                        }

                        console.log('🧪 draftTurns FINAL', draftTurns);

                        // 🔴 EDIT
                        if (editingShift) {

                          console.log('✏️ EDIT → GENERANDO SET_DAY');

                          const blocks = buildFinalDayBlocks({
                            date: editingShift.date,
                            backendDays,
                            draftTurns,
                            action: {
                              type: 'edit',
                              startTime,
                              endTime,
                              originalStartTime: editingShift.startTime,
                              originalEndTime: editingShift.endTime,
                            }
                          });

                          const newOp = {
                            type: 'SET_DAY',
                            date: editingShift.date,
                            blocks
                          };

                          setDraftTurns(prev => [
                            ...prev.filter(d => !(d.type === 'SET_DAY' && d.date === editingShift.date)),
                            newOp
                          ]);

                          setHasUnsavedChanges(true); // 🔥

                        } else {

                          // 🟢 ADD normal
                          addTurn();
                          setHasUnsavedChanges(true); // 🔥
                        }

                        setEditingShift(null);
                        setDateTo('');
                        setShowPanel(false);

                      }}
                    >
                      Aceptar
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>

      )}


      {/* CALENDARIO */}
      <div className="calendar-wrapper">

        <div className="calendar-header">

          <div className="calendar-week-text">
            Semana del{' '}
            {weekDates[1].toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
            })}
            {' '}–{' '}
            {weekDates[7].toLocaleDateString('es-ES', {
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
        <CalendarGrid
          calendarRef={calendarRef}
          calendarFocused={calendarFocused}
          setCalendarFocused={setCalendarFocused}
          hoursRef={hoursRef}
          headerXRef={headerXRef}
          savedTurns={turns}
          weekDays={weekDays}
          weekDates={weekDates}
          weekStart={weekStart}
          timeToRow={timeToRow}
          formatDateLocal={formatDateLocal}
          setShiftToDelete={setShiftToDelete}
          setDeleteShiftMode={setDeleteShiftMode}
          setShowShiftDeleteConfirm={setShowShiftDeleteConfirm}
          draftTurns={draftTurns}
          editingShift={editingShift}
          setEditingShift={setEditingShift}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          setSelectedDays={setSelectedDays}
          setShowPanel={setShowPanel}
          vacations={vacations}
          patternShifts={patternShifts}
          backendDays={backendDays}
        />

        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color normal"></div>
            <span>Turnos normales </span>
          </div>

          <div className="legend-item">
            <div className="legend-color exception"></div>
            <span>Día con excepción / vacaciones</span>
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
      {/* 🗑️ / ✏️ POP-UP — OPCIONES TURNO */}
      {showShiftDeleteConfirm && shiftToDelete && (
        <div className="modal-overlay">
          <div className="modal">

            {/* 🔥 DETECTAR SI ES EXCEPCIÓN */}
            {(() => {
              const backendDay = backendDays?.find(
                d => d.date === shiftToDelete?.date
              );

              const isException = backendDay?.hasException === true;

              return (
                <>
                  <h3>Turno</h3>

                  <p>
                    Turno del día <strong>{shiftToDelete.day}</strong>{' '}
                    de{' '}
                    <strong>
                      {shiftToDelete.startTime} – {shiftToDelete.endTime}
                    </strong>
                  </p>

                  {/* 🔽 SELECTOR DE MODO */}
                  <div className="delete-modes">

                    <label>
                      <input
                        type="radio"
                        name="shiftMode"
                        value="ONLY_THIS_BLOCK"
                        checked={deleteShiftMode === 'ONLY_THIS_BLOCK'}
                        onChange={() => setDeleteShiftMode('ONLY_THIS_BLOCK')}
                      />
                      <strong>Solo este día</strong>
                      <div className="hint">
                        Solo afecta a este día.
                      </div>
                    </label>

                    <label>
                      <input
                        type="radio"
                        name="shiftMode"
                        value="FROM_THIS_DAY_ON"
                        checked={deleteShiftMode === 'FROM_THIS_DAY_ON'}
                        onChange={() => setDeleteShiftMode('FROM_THIS_DAY_ON')}
                      />
                      <strong>Desde este día en adelante</strong>
                      <div className="hint">
                        Afecta a este turno y todos los futuros.
                      </div>
                    </label>

                  </div>

                  {/* 🔘 BOTONES */}
                  <div
                    className="modal-buttons"
                    style={{ display: 'flex', gap: 10 }}
                  >

                    {/* ✏️ EDITAR */}
                    <button
                      onClick={() => {

                        if (deleteShiftMode === 'FROM_THIS_DAY_ON') {
                          alert('No se puede editar en cascada. Solo puedes modificar un día.');
                          return;
                        }

                        const editingObject = {
                          ...shiftToDelete,
                          shiftId: shiftToDelete.shiftId || shiftToDelete.id,
                          mode: deleteShiftMode,
                          startTime: normalizeTime(shiftToDelete.startTime),
                          endTime: normalizeTime(shiftToDelete.endTime),
                        };

                        setEditingShift(editingObject);

                        setStartTime(editingObject.startTime);
                        setEndTime(editingObject.endTime);
                        setSelectedDays([]);

                        setDateFrom(shiftToDelete.date);
                        setDateTo(shiftToDelete.date);

                        setShowShiftDeleteConfirm(false);
                        setShowPanel(true);

                      }}
                    >
                      ✏️ Editar turno
                    </button>

                    {/* 🗑️ BORRAR TURNO */}
                    <button
                      className="delete-block"
                      onClick={() => {

                        const weekdays = [...new Set(
                          savedTurns
                            .filter(t => t.shiftId === shiftToDelete.shiftId)
                            .map(t => {
                              const d = new Date(t.date);
                              return d.getDay() === 0 ? 7 : d.getDay();
                            })
                        )];

                        const deleteVisualOp = {
                          type: 'DELETE_PREVIEW',
                          mode: deleteShiftMode,
                          date: deleteShiftMode === 'ONLY_THIS_BLOCK'
                            ? shiftToDelete.date
                            : undefined,
                          fromDate: deleteShiftMode === 'FROM_THIS_DAY_ON'
                            ? shiftToDelete.date
                            : undefined,
                          weekdays,
                          startTime: shiftToDelete.startTime,
                          endTime: shiftToDelete.endTime,
                        };

                        let deleteOp;

                        if (deleteShiftMode === 'ONLY_THIS_BLOCK') {
                          deleteOp = {
                            type: 'DELETE',
                            shiftId: shiftToDelete.shiftId,
                            date: shiftToDelete.date,
                            startTime: shiftToDelete.startTime,
                            endTime: shiftToDelete.endTime,
                            mode: deleteShiftMode,
                          };
                        } else {
                          deleteOp = {
                            type: 'DELETE',
                            mode: 'FROM_THIS_DAY_ON',
                            fromDate: shiftToDelete.date,
                            weekdays,
                            startTime: shiftToDelete.startTime,
                            endTime: shiftToDelete.endTime,
                          };
                        }

                        setDraftTurns(prev => [
                          ...prev,
                          deleteVisualOp,
                          deleteOp
                        ]);

                        setShowShiftDeleteConfirm(false);
                        setShiftToDelete(null);
                        setHasChanges(true);
                      }}
                    >
                      🗑️ Borrar turno
                    </button>

                    {/* CANCELAR */}
                    <button
                      onClick={() => {
                        setShowShiftDeleteConfirm(false);
                        setShiftToDelete(null);
                        setDeleteShiftMode('ONLY_THIS_BLOCK');
                      }}
                    >
                      Cancelar
                    </button>

                    {/* ♻️ RESTAURAR DÍA */}
                    {isException && (
                      <button
                        style={{
                          marginLeft: 'auto',
                          background: '#f97316',
                          color: 'white'
                        }}
                        onClick={() => {

                          const confirmRestore = window.confirm(
                            '¿Quieres eliminar todas las modificaciones de este día y volver al horario habitual?'
                          );

                          if (!confirmRestore) return;

                          const deleteExceptionOp = {
                            type: 'DELETE_EXCEPTION',
                            date: shiftToDelete.date,
                          };

                          setDraftTurns(prev => [
                            ...prev,
                            deleteExceptionOp
                          ]);

                          setShowShiftDeleteConfirm(false);
                          setShiftToDelete(null);
                          setHasChanges(true);
                        }}
                      >
                        ♻️ Restaurar día
                      </button>
                    )}

                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}
    </div>
  );
}