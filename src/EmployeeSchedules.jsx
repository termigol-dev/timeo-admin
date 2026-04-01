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
  savedTurns,
  draftTurns,
  action,
}) {

  console.log('🧠 buildFinalDayBlocks INPUT', { date, action });

  // ======================================================
  // 1️⃣ BASE DEL DÍA (draft > saved)
  // ======================================================
  const existingDraft = draftTurns.find(d =>
    d.type === 'SET_DAY' && d.date === date
  );

  let baseBlocks;

  if (existingDraft) {
    console.log('🟡 USANDO BASE DESDE DRAFT');

    baseBlocks = existingDraft.blocks.map(b => ({
      startTime: b.startTime,
      endTime: b.endTime,
      edited: b.edited ?? false,
    }));

  } else {
    console.log('🟢 USANDO BASE DESDE SAVED');

    baseBlocks = savedTurns
      .filter(t => t.date === date)
      .map(t => ({
        startTime: t.startTime,
        endTime: t.endTime,
        edited: false,
      }));
  }

  console.log('🧱 BASE BLOCKS', baseBlocks);

  // ======================================================
  // 2️⃣ APLICAR ACCIÓN (EDIT)
  // ======================================================
  if (action?.type === 'edit') {

    const { startTime, endTime } = action;

    console.log('✏️ APLICANDO EDIT', { startTime, endTime });

    // ❌ eliminar el bloque original (el que coincide con el panel antes)
    // usamos start/end actuales del editingShift (los antiguos)
    const cleaned = baseBlocks.filter(b =>
      !(b.startTime === action.originalStartTime &&
        b.endTime === action.originalEndTime)
    );

    console.log('🧹 AFTER REMOVE', cleaned);

    // ➕ añadir nuevo bloque editado
    const next = [
      ...cleaned,
      {
        startTime,
        endTime,
        edited: true, // 🔥 CLAVE
      }
    ];

    console.log('🧱 AFTER ADD', next);

    return next;
  }

  return baseBlocks;
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

  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState('');
  const [turns, setTurns] = useState([]);
  const [vacations, setVacations] = useState([]);
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

    // 🛑 BLINDAJE DE INICIALIZACIÓN
    if (!employee || !employee.branchId || !employeeId) {
      console.log('⏸️ reloadActiveSchedule cancelado: employee no listo aún');
      return;
    }

    try {

      const token = localStorage.getItem('token');

      // 🔑 SIEMPRE FECHA LOCAL — NUNCA ISO
      const weekStartStr = formatDateLocal(weekStart);

      console.log('🧪 DEBUG weekStart raw (LOCAL):', weekStartStr);
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

      // 🔍 LOG CRÍTICO — ver estructura backend
      console.log('🧪 RAW DAYS FROM BACKEND', schedule?.days);

      // 🔑 LIMPIAR SIEMPRE ESTADO ANTES DE CONSTRUIR
      const loadedTurns = [];
      const loadedVacations = [];

      if (schedule && Array.isArray(schedule.days)) {

        schedule.days.forEach(day => {

          const dayKey = weekDays[day.weekday];

          /*console.log('🧪 PROCESSING DAY', {
            date: day.date,
            weekday: day.weekday,
            turns: day.turns?.length
          });*/

          // 🟢 TURNOS
          if (Array.isArray(day.turns)) {

            day.turns.forEach(t => {

              /*console.log('🧪 SHIFT DESDE BACKEND', {
                backendShiftId: t.id,
                date: day.date,
                startTime: t.startTime,
                endTime: t.endTime,
                source: t.source
              });*/

              const uiId = `${day.date}-${t.startTime}-${t.endTime}`;

              const turnBlock = {
                id: uiId,          // id visual del calendario
                shiftId: t.id,     // ⭐ ID REAL DE BASE DE DATOS
                days: [dayKey],
                startTime: t.startTime,
                endTime: t.endTime,
                type: t.source === 'extra' ? 'extra' : 'regular',
                source: t.source || 'saved',
                date: day.date,
              };

              /*console.log('🧪 BLOQUE CALENDARIO CREADO', {
                uiId: turnBlock.id,
                shiftId: turnBlock.shiftId,
                date: turnBlock.date,
                startTime: turnBlock.startTime,
                endTime: turnBlock.endTime
              });*/

              loadedTurns.push(ensureShiftId(turnBlock));

            });

          }

          // 🟠 VACACIONES
          if (day.isVacation) {

            console.log('🧪 VACATION DETECTED', {
              date: day.date
            });

            loadedVacations.push({
              date: day.date,
              source: 'saved',
            });

          }

        });

      }

      console.log('📊 RESULTADO FINAL SEMANA:', {
        turns: loadedTurns.length,
        vacations: loadedVacations.length,
      });

      console.log('🧪 FINAL TURNS ARRAY', loadedTurns);

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

    // ======================================================
    // 🔵 CASO EDICIÓN DE TURNO EXISTENTE
    // ======================================================
    if (editingShift) {

      console.log('✏️ EDIT → GENERANDO DELETE + ADD_SHIFT');

      const map = { L: 1, M: 2, X: 3, J: 4, V: 5, S: 6, D: 7 };

      const weekdays = selectedDays.map(d => map[d]);

      console.log('🧪 DEBUG DELETE INPUT', {
        selectedDays,
        weekdays,
        deleteShiftMode,
        dateFrom,
      });

      if (weekdays.length === 0) {
        alert('Debes seleccionar al menos un día');
        return;
      }

      // 🔴 DELETE REAL (backend)
      const deleteOps = [{
        type: 'DELETE',
        mode: 'FROM_THIS_DAY_ON',
        fromDate: dateFrom,
        weekdays,
        startTime: editingShift.startTime,
        endTime: editingShift.endTime
      }];

      // 🔥 DELETE VISUAL (gris) → MODELO NUEVO (REGLA)
      const deleteVisualOp = {
        type: 'DELETE_PREVIEW',
        mode: deleteShiftMode,

        // 🟡 solo este día
        date: deleteShiftMode === 'ONLY_THIS_BLOCK'
          ? dateFrom
          : undefined,

        // 🔴 cascada
        fromDate: deleteShiftMode === 'FROM_THIS_DAY_ON'
          ? dateFrom
          : undefined,

        weekdays,

        startTime: editingShift.startTime,
        endTime: editingShift.endTime
      };

      // 🟢 ADD_SHIFT → uno por cada día (nuevo patrón)
      const addOps = weekdays.map(day => ({
        type: 'ADD_SHIFT',
        weekday: day,
        startTime,
        endTime,
        validFrom: dateFrom,
        validTo: null
      }));

      setDraftTurns(prev => [
        ...prev,
        deleteVisualOp, // 👈 gris
        ...deleteOps,       // 👈 backend
        ...addOps           // 👈 amarillo/normal
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
    // 🟢 ALTA NORMAL (NO TOCADA)
    // ======================================================

    const dayMap = {
      L: 1,
      M: 2,
      X: 3,
      J: 4,
      V: 5,
      S: 6,
      D: 7,
    };

    const newTurn = selectedDays.map(day => ({
      type: 'ADD_SHIFT',
      weekday: dayMap[day],
      startTime,
      endTime,
      validFrom: dateFrom,
      validTo: dateTo && dateTo !== '' ? dateTo : null,
    }));

    setDraftTurns(prev => [...prev, ...newTurn]);

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

    setVacations(prev => [...prev, ...days]);
    setDateFrom('');
    setDateTo('');
  }

  async function completeSchedule() {
    const token = localStorage.getItem('token');

    console.log('▶️ completeSchedule START', {
      scheduleId,
      draftTurns: draftTurns.length,
    });

    let activeScheduleId = scheduleId;

    try {
      setSaving(true);

      // ======================================================
      // 1️⃣ asegurar schedule
      // ======================================================
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

      // ======================================================
      // 2️⃣ ordenar operaciones
      // ======================================================
      const ordered = [...draftTurns].sort((a, b) => {
        if (a.type === 'DELETE' && b.type !== 'DELETE') return -1;
        if (a.type !== 'DELETE' && b.type === 'DELETE') return 1;
        return 0;
      });

      console.log('🚀 OPS QUE SE ENVÍAN AL BACKEND:', JSON.stringify(ordered, null, 2));
      console.log('🧪 ORDERED DEBUG:', ordered);

      // ======================================================
      // 3️⃣ ejecutar operaciones
      // ======================================================
      for (const op of ordered) {

        // 🟡 SET_DAY → EXCEPCIÓN
        if (op.type === 'SET_DAY') {
          console.log('🟡 SET_DAY → CREANDO EXCEPCIÓN', op);

          const res = await fetch(
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
                    blocks: op.blocks,
                    mode: 'ONLY_THIS_BLOCK',
                  }
                ]
              }),
            }
          );

          if (!res.ok) {
            const text = await res.text();
            throw new Error('Error creando excepción: ' + text);
          }

          continue;
        }

        // 🔴 DELETE (BLINDADO)
        if (op.type === 'DELETE') {

          if (op.type === 'DELETE') {

            console.log('🟡 FRONT → DELETE BODY', op);

            let body;

            // 🟢 CASO 1 — DELETE POR shiftId (ONLY_THIS_BLOCK)
            if (op.shiftId) {
              body = {
                shiftId: op.shiftId,
              };
            }

            // 🔵 CASO 2 — DELETE POR PATRÓN
            else {
              if (!op.weekdays || op.weekdays.length === 0) {
                console.log('💣 DELETE IGNORADO (corrupto):', op);
                continue;
              }

              body = {
                mode: op.mode,
                fromDate: op.fromDate,
                weekdays: op.weekdays,
                startTime: op.startTime,
                endTime: op.endTime,
              };
            }

            const res = await fetch(
              `${import.meta.env.VITE_API_URL}/companies/${employee.companyId}/branches/${employee.branchId}/schedules/${id}/shifts`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
              }
            );

            if (!res.ok) {
              const text = await res.text();
              throw new Error('Error borrando turno: ' + text);
            }

            continue;
          }

          console.log('🟡 FRONT → DELETE BODY', op);

          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/companies/${employee.companyId}/branches/${employee.branchId}/schedules/${id}/shifts`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                mode: op.mode,
                fromDate: op.fromDate,
                weekdays: op.weekdays,
                startTime: op.startTime,
                endTime: op.endTime,
              }),
            }
          );

          if (!res.ok) {
            const text = await res.text();
            throw new Error('Error borrando turno: ' + text);
          }

          // 🔥 NUEVO → VALIDAR RESULTADO
          const result = await res.json();

          console.log('🧪 DELETE RESULT:', result);

          if (!result.affected || result.affected === 0) {
            throw new Error('DELETE no ha afectado a ningún turno → operación cancelada');
          }

          continue;
        }

        // 🟢 ADD_SHIFT
        if (op.type === 'ADD_SHIFT') {
          console.log('🟢 ADD_SHIFT', op);

          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/companies/${employee.companyId}/branches/${employee.branchId}/schedules/${id}/shifts`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                weekday: op.weekday,
                startTime: op.startTime,
                endTime: op.endTime,
                validFrom: op.validFrom,
                validTo: op.validTo,
              }),
            }
          );

          if (!res.ok) {
            const text = await res.text();
            throw new Error('Error creando turno (ADD_SHIFT): ' + text);
          }

          continue;
        }
      }

      // ======================================================
      // 4️⃣ confirmar
      // ======================================================
      if (ordered.length > 0) {
        const confirmRes = await fetch(
          `${import.meta.env.VITE_API_URL}/companies/${employee.companyId}/branches/${employee.branchId}/schedules/${id}/confirm`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!confirmRes.ok) {
          const text = await confirmRes.text();
          throw new Error('CONFIRM FAILED: ' + text);
        }
      }

      console.log('✅ SCHEDULE GUARDADO');

      setDraftTurns([]);
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
    weekVacationBlocks,
  } = useCalendarData({
    shifts: turns,
    vacations,
    weekDates,
  });

  vacations.forEach((v, index) => {
    const day = new Date(v.date + 'T00:00:00');

    weekDates.forEach((date, colIndex) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

    });

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

  //console.log('EMPLOYEE:', employee);
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
          <button onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>

      </div>

      {/* BOTONES PRINCIPALES */}

      <div className="form-buttons-row">

        <button
          onClick={addVacation}
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
          onClick={() => setShowPanel(false)}
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
                    disabled={editingShift?.mode === 'FROM_THIS_DAY_ON'} // 🔥 CLAVE
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
                  />

                  <div className="caption">Salida</div>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="time-input"
                  />

                  {/* BOTONES */}
                  <div className="form-inline-buttons">

                    <button
                      onClick={() => {
                        setShowPanel(false);
                      }}
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={() => {

                        console.log('🧪 selectedDays CLICK', selectedDays);

                        if (!startTime || !endTime) {
                          alert('Debes indicar hora de entrada y salida');
                          return;
                        }

                        if (endTime <= startTime) {
                          alert('La hora de salida debe ser mayor que la de entrada');
                          return;
                        }

                        // 🔥 UNIFICAMOS TODO
                        addTurn();

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
          weekVacationBlocks={weekVacationBlocks}
          savedTurns={savedTurns}
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
        />

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
              style={{ justifyContent: 'space-between' }}
            >

              {/* ✏️ EDITAR */}
              <button
                onClick={() => {

                  console.log('🧪 EDIT SHIFT CLICK', shiftToDelete);

                  const editingObject = {
                    ...shiftToDelete,
                    shiftId: shiftToDelete.shiftId || shiftToDelete.id,
                    mode: deleteShiftMode,
                    startTime: normalizeTime(shiftToDelete.startTime),
                    endTime: normalizeTime(shiftToDelete.endTime),
                  };

                  console.log('🧪 EDIT → EDITING SHIFT OBJECT', editingObject);

                  setEditingShift(editingObject);


                  // 🔥 SINCRONIZACIÓN FORM
                  setStartTime(editingObject.startTime);
                  setEndTime(editingObject.endTime);
                  setSelectedDays([]);

                  setDateFrom(shiftToDelete.date);

                  // 🔥 FIX CLAVE
                  if (deleteShiftMode === 'FROM_THIS_DAY_ON') {
                    setDateTo(''); // ← infinito
                  } else {
                    setDateTo(shiftToDelete.date); // ← solo ese día
                  }

                  setShowShiftDeleteConfirm(false);
                  setShowPanel(true);

                }}
              >
                ✏️ Editar turno
              </button>

              {/* 🗑️ BORRAR */}
              <button
                className="delete-block"
                onClick={() => {

                  const map = { L: 1, M: 2, X: 3, J: 4, V: 5, S: 6, D: 7 };

                  console.log('🧪 DELETE CLICK INPUT', {
                    shiftToDelete,
                    deleteShiftMode,
                    weekDates: weekDates.map(d => d ? formatDateLocal(d) : 'NULL')
                  });

                  // 🔥 reconstruir patrón real desde savedTurns
                  const weekdays = shiftToDelete.weekdays || [];

                  console.log('🧪 WEEKDAYS DESDE GRID', weekdays);

                  // ======================================================
                  // 🔥 DELETE VISUAL (gris) → REGLA
                  // ======================================================
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

                  console.log('🧪 DELETE VISUAL OPS', [deleteVisualOp]);

                  // ======================================================
                  // 🔴 DELETE REAL
                  // ======================================================
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
                      weekdays, // 🔥 MISMO FIX AQUÍ
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

            </div>
          </div>
        </div>
      )}
    </div>
  );
}