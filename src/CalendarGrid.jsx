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
    const backendTurns = savedTurns.filter(t => t.date === date);

    // ======================================================
    // 1. SET_DAY → sustituye todo (igual que ahora)
    // ======================================================
    const draft = draftTurns?.find(d =>
      d.type === 'SET_DAY' && d.date === date
    );

    if (draft) {
      return draft.blocks.map((b, idx) => ({
        startTime: b.startTime,
        endTime: b.endTime,
        id: `${date}-${b.startTime}-${b.endTime}-${idx}`,
        shiftId: null,
        edited: true,
      }));
    }

    // ======================================================
    // 🔴 2. DELETE_PREVIEW → REGLA (gris)
    // ======================================================
    const deleteDrafts = draftTurns?.filter(d => {

      if (d.type !== 'DELETE_PREVIEW') return false;

      /*console.log('🧪 CHECK DELETE RULE', {
        d,
        date,
        weekday
      });*/

      // 🟡 SOLO ESTE DÍA
      if (d.mode === 'ONLY_THIS_BLOCK') {
        const match = d.date === date;

        /*console.log('🟡 ONLY_THIS_BLOCK', {
          match
        });*/

        return match;
      }

      // 🔴 CASCADA (MISMA LÓGICA QUE ADD_SHIFT PERO MULTIDÍA)
      if (d.mode === 'FROM_THIS_DAY_ON') {

        const matchesWeekday = d.weekdays?.includes(weekday);
        const matchesDate = date >= d.fromDate;

        /*console.log('🔴 CASCADE CHECK (FIX FINAL)', {
          ruleWeekdays: d.weekdays,
          currentWeekday: weekday,
          matchesWeekday,
          fromDate: d.fromDate,
          currentDate: date,
          matchesDate
        });*/

        return matchesWeekday && matchesDate;
      }

      return false;
    });

    // ======================================================
    // 3. ADD_SHIFT
    // ======================================================
    const draftShifts = draftTurns
      ?.filter(d =>
        d.type === 'ADD_SHIFT' &&
        d.weekday === weekday &&
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

    // 🔥 overlay (NO sustituir)
    const combinedBlocks = [
      ...backendTurns.map(t => ({
        startTime: t.startTime,
        endTime: t.endTime,
        shiftId: t.shiftId,
        id: t.id,
        edited: false,
        isDelete: false,
      })),
      ...(draftShifts || [])
    ];

    return combinedBlocks;

    // ======================================================
    // 4. BACKEND
    // ======================================================




    // 🟢 backend normal
    const backendBlocks = backendTurns.map(t => {

      const isDeleted = (deleteDrafts || []).some(d => {

        // 🟡 mismo patrón (horas iguales)
        if (d.startTime === t.startTime && d.endTime === t.endTime) {
          return true;
        }

        // 🔴 intersección de horas (CLAVE PARA CASCADA)
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
        weekdays: [t.weekday], // 👈 consistente con tu modelo actual
      };
    });

    // 🔥 CLAVE: overlay (NO sustituir)
    return backendBlocks;
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

                const vacation = vacations?.find(v =>
                  v?.date === dateStr
                );

                if (!vacation) return null;

                return (
                  <div
                    key={`vac-${dateStr}`}
                    className={`vacation ${vacation.source === 'backend' ? 'saved' : 'draft'}`} // ✅ SOLO ESTO
                    style={{
                      gridColumn: i, // 🔒 NO TOCO NADA MÁS
                      gridRow: '1 / 49',
                    }}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    Vacaciones
                  </div>
                );
              })}
              {/* TURNOS */}
              {weekDates.slice(1).map((dateObj, i) => {

                const col = i + 1;
                const currentDate = formatDateLocal(dateObj);
                const day = weekDays[col];

                // 🔥 NUEVO → bloquear si hay vacaciones
                if (vacations?.some(v => v.date === currentDate)) {
                  return null;
                }

                const blocks = getBlocksForDate(currentDate);

                return blocks.map((b, idx) => {

                  const start = timeToRow(b.startTime);
                  let end = timeToRow(b.endTime);
                  if (end <= start) end += 48;

                  return (
                    <div
                      key={`${currentDate}-${idx}`}
                      className={`turn-saved + ${b.source === 'modified' ? 'exception' : ''}
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

                        //console.log('🖱️ CLICK TURNO → MODAL', blockData);

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