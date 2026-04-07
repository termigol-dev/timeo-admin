import React from 'react';
import './EmployeeSchedules.css';

export default function CalendarGrid({
  calendarRef,
  calendarFocused,
  setCalendarFocused,
  hoursRef,
  headerXRef,
  weekVacationBlocks,
  savedTurns,
  draftTurns,
  editingPreview,
  weekDays,
  weekDates,
  weekStart,
  timeToRow,
  formatDateLocal,
  setShiftToDelete,
  setDeleteShiftMode,
  setShowShiftDeleteConfirm,
  editingShift,
  vacations,
  setEditingShift,
  setStartTime,
  setEndTime,
  setSelectedDays,
  setShowPanel,
}) {

  //console.log('🧪 DRAFT TURNS:', draftTurns);

  // 🧠 ÚNICA FUENTE DE VERDAD POR DÍA
 function getBlocksForDate(date) {

  const dateObj = new Date(date);
  const weekday = dateObj.getDay() === 0 ? 7 : dateObj.getDay();

  console.log('📅 DATE', date, '→ weekday', weekday);

  // ======================================================
  // 🟢 BACKEND TURNS (modelo híbrido + debug)
  // ======================================================
  const backendTurns = savedTurns.filter(t => {

    // 🔍 DEBUG RAW
    console.log('🔍 TURN RAW', t);

    let parsedWeekdays = [];

    // 🧠 normalizar weekdays
    if (Array.isArray(t.weekdays)) {
      parsedWeekdays = t.weekdays;
    } else if (typeof t.weekdays === 'string') {
      parsedWeekdays = t.weekdays.split(',').map(Number);
    }

    console.log('🧠 PARSED WEEKDAYS', parsedWeekdays);

    const isNewModel = parsedWeekdays.length > 0;

    if (isNewModel) {
      const matchesWeekday = parsedWeekdays.includes(weekday);
      const matchesDate =
        date >= t.validFrom &&
        (!t.validTo || date <= t.validTo);

      console.log('🟢 CHECK NEW MODEL', {
        parsedWeekdays,
        matchesWeekday,
        matchesDate
      });

      return matchesWeekday && matchesDate;
    }

    // 🔵 modelo antiguo
    const matchOld = t.date === date;

    console.log('🔵 CHECK OLD MODEL', {
      tDate: t.date,
      matchOld
    });

    return matchOld;
  });

  console.log('🟢 BACKEND TURNS RESULT', backendTurns);

  // ======================================================
  // 🔒 detectar SET_DAY
  // ======================================================
  const hasSetDay = draftTurns?.some(d => d.type === 'SET_DAY');

  // ======================================================
  // 1. SET_DAY → sustituye todo
  // ======================================================
  const draft = draftTurns?.find(d =>
    d.type === 'SET_DAY' && d.date === date
  );

  if (draft) {
    console.log('🟠 SET_DAY aplicado', draft);

    return draft.blocks.map((b, idx) => ({
      startTime: b.startTime,
      endTime: b.endTime,
      id: `${date}-${b.startTime}-${b.endTime}-${idx}`,
      shiftId: null,
      edited: true,
      source: 'modified',
    }));
  }

  // ======================================================
  // 🔴 DELETE_PREVIEW
  // ======================================================
  const deleteDrafts = draftTurns?.filter(d => {

    if (d.type !== 'DELETE_PREVIEW') return false;

    if (hasSetDay && d.mode === 'FROM_THIS_DAY_ON') return false;

    if (d.mode === 'ONLY_THIS_BLOCK') {
      return d.date === date;
    }

    if (d.mode === 'FROM_THIS_DAY_ON') {
      const matchesWeekday = d.weekdays?.includes(weekday);
      const matchesDate = date >= d.fromDate;

      return matchesWeekday && matchesDate;
    }

    return false;
  });

  // ======================================================
  // 🟢 ADD_SHIFT (draft → modelo nuevo)
  // ======================================================
  const draftShifts = draftTurns
    ?.filter(d =>
      d.type === 'ADD_SHIFT' &&
      !hasSetDay &&
      d.weekdays?.includes(weekday) &&
      date >= d.validFrom &&
      (!d.validTo || date <= d.validTo)
    )
    .map((d, idx) => ({
      startTime: d.startTime,
      endTime: d.endTime,
      id: `draft-${weekday}-${idx}`,
      shiftId: null,
      edited: true,
    }));

  console.log('🟢 DRAFT SHIFTS', draftShifts);

  // ======================================================
  // 🟢 backend normal
  // ======================================================
  const backendBlocks = backendTurns.map(t => {

    const isDeleted = (deleteDrafts || []).some(d => {

      if (d.startTime === t.startTime && d.endTime === t.endTime) {
        return true;
      }

      return (
        d.startTime <= t.startTime &&
        d.endTime >= t.endTime
      );
    });

    return {
      startTime: t.startTime,
      endTime: t.endTime,
      shiftId: t.shiftId,
      id: t.id,
      edited: false,
      isDelete: isDeleted,
      weekday: t.weekday,
      weekdays: t.weekdays || [t.weekday],
    };
  });

  const finalBlocks = [
    ...backendBlocks,
    ...(draftShifts || [])
  ];

  console.log('🎨 FINAL BLOCKS', finalBlocks);

  return finalBlocks;
}

  return (
    <div className="calendar-scale-wrapper">
      <div className="calendar-grid-wrapper">

        {/* HEADER */}
        <div
          ref={headerXRef}
          className={`calendar-header-x ${calendarFocused ? 'focused' : ''}`}
          onMouseDown={() => setCalendarFocused(true)}
        >
          <div className="calendar-days-header">
            <div />
            {weekDates.slice(1).map((date, i) => (
              <div key={i + 1} className="calendar-day-header">
                {date.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                })}
              </div>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="calendar-body">
          <div
            ref={calendarRef}
            onMouseDown={() => setCalendarFocused(true)}
            className={`calendar-scroll ${calendarFocused ? 'focused' : ''}`}
          >

            {/* HORAS */}
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
                Array.from({ length: 7 }).map((_, i) => {
                  const col = i + 1;

                  return (
                    <div
                      key={`${row}-${col}`}
                      className="calendar-cell"
                      style={{
                        gridColumn: col,
                        gridRow: row + 1,
                      }}
                    />
                  );
                })
              )}

              {/* VACACIONES (DIRECTO DESDE STATE) */}
              {weekDates.map((date, i) => {

                if (!date) return null;

                const dateStr = formatDateLocal(date);

                const vacation = vacations?.find(
                  v => v?.date === dateStr && v.type === 'DAY_OFF'
                );

                if (!vacation) return null;

                return (
                  <div
                    key={`vac-${dateStr}`}
                    className="vacation-block"
                    style={{
                      gridColumn: i,
                      gridRow: '1 / 49',
                    }}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <div className="vacation-label">
                      Vacaciones
                    </div>
                  </div>
                );
              })}

              {/* TURNOS */}
              {weekDates.slice(1).map((dateObj, i) => {

                const col = i + 1;
                const currentDate = formatDateLocal(dateObj);
                const day = weekDays[col];

                const dayState = vacations.find(v => v.date === currentDate);
                //console.log('🧪 DAY STATE', currentDate, dayState);
                // 🔴 DAY_OFF → no hay turnos
                if (dayState?.type === 'DAY_OFF') {
                  return null;
                }

                // 🟠 cualquier otro caso con dayState → es excepción
                const isExceptionDay = !!dayState;

                const blocks = getBlocksForDate(currentDate);

                return blocks.map((b, idx) => {

                  const start = timeToRow(b.startTime);
                  let end = timeToRow(b.endTime);
                  if (end <= start) end += 48;

                  return (
                    <div
                      key={`${currentDate}-${idx}`}
                      className={`
          turn-saved
          ${isExceptionDay ? 'exception' : ''}
          ${b.edited ? 'edited' : ''}
          ${b.isDelete ? 'deleted' : ''}
        `}
                      style={{
                        gridColumn: col,
                        gridRow: `${start + 1} / ${end + 1}`,
                      }}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation();

                        const blockId = b.id || `${currentDate}-${b.startTime}-${b.endTime}`;
                        if (!blockId) return;

                        const effectiveShiftId = b.shiftId || blockId;

                        const blockData = {
                          id: blockId,
                          shiftId: effectiveShiftId,
                          day,
                          col,
                          date: currentDate,
                          startTime: b.startTime,
                          endTime: b.endTime,
                          weekdays: b.weekdays,
                        };

                        setShiftToDelete(blockData);
                        setDeleteShiftMode('ONLY_THIS_BLOCK');
                        setShowShiftDeleteConfirm(true);
                      }}
                    >
                      {b.startTime} – {b.endTime}
                    </div>
                  );
                });

              })}

              {/* PREVIEW */}
              {editingShift &&
                editingPreview &&
                editingPreview.startTime &&
                editingPreview.endTime && (
                  <div
                    key={`preview-${editingPreview.day}-${editingPreview.startTime}`}
                    className="turn-preview preview-add"
                    style={{
                      gridColumn: editingPreview.col ?? editingPreview.day,
                      gridRow: `${timeToRow(editingPreview.startTime) + 1} / ${timeToRow(editingPreview.endTime) + 1}`,
                    }}
                  >
                    {editingPreview.startTime} – {editingPreview.endTime}
                  </div>
                )}

            </div>
          </div>
        </div>
      </div>
    </div>

  );
}