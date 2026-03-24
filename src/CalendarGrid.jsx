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
  setEditingShift,
  setStartTime,
  setEndTime,
  setSelectedDays,
  setShowPanel,
}) {

  console.log('🧪 DRAFT TURNS:', draftTurns);

  // 🧠 ÚNICA FUENTE DE VERDAD POR DÍA
  function getBlocksForDate(date) {

    // ======================================================
    // 1. DRAFT (estado final del día)
    // ======================================================
    const draft = draftTurns?.find(d =>
      d.type === 'SET_DAY' && d.date === date
    );

    if (draft) {
      return draft.blocks.map((b, idx) => ({
        startTime: b.startTime,
        endTime: b.endTime,

        // 🔥 IMPORTANTE: shape consistente
        id: `${date}-${b.startTime}-${b.endTime}-${idx}`,
        shiftId: null, // no viene de backend

        // 🔥 NUEVO
        edited: b.edited ?? true,
      }));
    }

    // ======================================================
    // 2. BACKEND (saved)
    // ======================================================
    const backendTurns = savedTurns.filter(t => t.date === date);

    return backendTurns.map(t => ({
      startTime: t.startTime,
      endTime: t.endTime,
      shiftId: t.shiftId,
      id: t.id,

      // 🔥 NUEVO
      edited: false,
    }));
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

            {/* VACACIONES */}
            {weekVacationBlocks.map(v => (
              <div
                key={v.key}
                className={`vacation ${v.source === 'draft' ? 'draft' : ''}`}
                style={{
                  gridColumn: v.col,
                  gridRow: '1 / 49',
                }}
                onMouseDown={e => e.stopPropagation()}
              >
                Vacaciones
              </div>
            ))}

            {/* TURNOS */}
            {weekDates.slice(1).map((dateObj, i) => {

              const col = i + 1;
              const currentDate = formatDateLocal(dateObj);
              const day = weekDays[col];

              const blocks = getBlocksForDate(currentDate);

              return blocks.map((b, idx) => {

                const start = timeToRow(b.startTime);
                let end = timeToRow(b.endTime);
                if (end <= start) end += 48;

                return (
                  <div
                    key={`${currentDate}-${idx}`}
                    className={`turn-saved ${b.edited ? 'edited' : ''}`}
                    style={{
                      gridColumn: col,
                      gridRow: `${start + 1} / ${end + 1}`,
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();

                      const blockId = b.id || `${currentDate}-${b.startTime}-${b.endTime}`;

                      console.log('🧪 CLICK BLOQUE', {
                        blockId,
                        shiftId: b.shiftId,
                        startTime: b.startTime,
                        endTime: b.endTime,
                      });

                      if (!blockId) return;

                      const effectiveShiftId = b.shiftId || blockId;

                      setEditingShift({
                        id: blockId,
                        shiftId: effectiveShiftId,
                        day,
                        col,
                        date: currentDate,
                        startTime: b.startTime,
                        endTime: b.endTime,
                      });

                      setStartTime(b.startTime);
                      setEndTime(b.endTime);
                      setSelectedDays([day]);

                      setShowPanel(true);
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