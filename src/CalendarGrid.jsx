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
  patternShifts,
  backendDays
}) {

  //console.log('🧪 DRAFT TURNS:', draftTurns);

  // 🧠 ÚNICA FUENTE DE VERDAD POR DÍA
  function getBlocksForDate(date) {

    // 🔥 1. BACKEND (estado persistido)
    const dayData = backendDays?.find(d => d.date === date);
    if (!dayData) return [];

    const patternTurns = dayData.patternTurns || [];
    const finalTurns = dayData.turns || [];
    const weekday = dayData.weekday;

    // 🔥 2. DRAFT EXCEPCIÓN (preview)
    const draftException = draftTurns?.find(d =>
      d.type === 'SET_DAY' && d.date === date
    );

    // 🔥 2.5 RESTORE EXCEPTION (nuevo)
    const deleteExceptionDraft = draftTurns?.some(d =>
      d.type === 'DELETE_EXCEPTION' && d.date === date
    );

    // 🔥 3. DRAFT ADD (preview amarillo)
    const addDrafts = draftTurns?.filter(d => {
      if (d.type !== 'ADD_SHIFT') return false;

      const matchesWeekday = d.weekdays?.includes(weekday);

      const inRange =
        (!d.validFrom || date >= d.validFrom) &&
        (!d.validTo || date <= d.validTo);

      return matchesWeekday && inRange;
    }) || [];

    // 🔑 CLAVE: excepción = backend OR draft (pero NO si restauras)
    const hasException =
      !deleteExceptionDraft &&
      (dayData.hasException === true || !!draftException);

    /*console.log('🧪 GRID DAY DATA', {
      date,
      patternTurns,
      finalTurns,
      draftException,
      addDrafts,
      hasException,
      deleteExceptionDraft
    });*/

    // ======================================================
    // 🟢 RESTORE EXCEPTION → usar patrón (verde pálido)
    // ======================================================
    if (deleteExceptionDraft) {

      const blocks = patternTurns.map((t, idx) => ({
        startTime: t.startTime,
        endTime: t.endTime,
        id: `restored-${date}-${idx}`,
        shiftId: t.shiftId || t.id,
        isException: false,
        deleted: false,
        restored: true // 🔥 clave visual
      }));



      // 🟡 ADD encima del restaurado
      addDrafts.forEach((d, idx) => {
        blocks.push({
          startTime: d.startTime,
          endTime: d.endTime,
          id: `draft-${date}-${idx}`,
          shiftId: null,
          isException: false,
          deleted: false,
          edited: true
        });
      });

      return blocks;
    }

    // ======================================================
    // 🟠 DÍA CON EXCEPCIÓN → SNAPSHOT (draft > backend)
    // ======================================================
    if (hasException) {

      const snapshot = draftException?.blocks || finalTurns;

      const blocks = [];
      console.log('🧪 SNAPSHOT SOURCE', {
        hasDraft: !!draftException,
        snapshot: draftException?.blocks
      });

      // 🟡 1. BLOQUES ACTUALES
      const deleteDrafts = draftTurns?.filter(d =>
        d.type === 'DELETE_PREVIEW' &&
        d.date === date
      );

      snapshot.forEach((t, idx) => {

        const isDeleted = deleteDrafts?.some(d =>
          d.startTime === t.startTime &&
          d.endTime === t.endTime
        );

        console.log('🧪 BLOCK', {
          start: t.startTime,
          end: t.endTime,
          isDeleted
        });

        blocks.push({
          startTime: t.startTime,
          endTime: t.endTime,
          id: `${date}-${t.startTime}-${t.endTime}-${idx}`,
          shiftId: t.id || null,
          isException: true,
          isPreviewDeleted: isDeleted,
          edited: t.edited === true
        });
      });

      // 🔴 2. BLOQUES ELIMINADOS
      patternTurns.forEach((p, idx) => {

        const stillExists = snapshot.some(t =>
          !(t.endTime <= p.startTime || t.startTime >= p.endTime)
        );

        if (!stillExists) {
          blocks.push({
            startTime: p.startTime,
            endTime: p.endTime,
            id: `deleted-${date}-${idx}`,
            shiftId: null,
            isException: true,
            deleted: true
          });
        }
      });

      // 🟡 3. ADD DRAFT
      addDrafts.forEach((d, idx) => {
        blocks.push({
          startTime: d.startTime,
          endTime: d.endTime,
          id: `draft-${date}-${idx}`,
          shiftId: null,
          isException: false,
          deleted: false,
          edited: true
        });
      });



      return blocks;
    }

    // ======================================================
    // 🔴 DELETE PREVIEW (solo si NO hay excepción)
    // ======================================================
    const deleteDrafts = draftTurns?.filter(d =>
      d.type === 'DELETE_PREVIEW' &&
      (
        (d.mode === 'ONLY_THIS_BLOCK' && d.date === date) ||
        (d.mode === 'FROM_THIS_DAY_ON' && date >= d.fromDate)
      )
    );

    // ======================================================
    // 🟢 DÍA NORMAL → PATRÓN + ADD
    // ======================================================
    const blocks = patternTurns.map((t, idx) => {

      const isDeleted = deleteDrafts?.some(d =>
        d.startTime === t.startTime &&
        d.endTime === t.endTime
      );

      return {
        startTime: t.startTime,
        endTime: t.endTime,
        id: t.id || `${date}-${idx}`,
        shiftId: t.shiftId || t.id,
        isDelete: isDeleted,
        isException: false,
        deleted: false
      };
    });

    // 🟡 ADD aunque backend esté vacío
    addDrafts.forEach((d, idx) => {
      blocks.push({
        startTime: d.startTime,
        endTime: d.endTime,
        id: `draft-${date}-${idx}`,
        shiftId: null,
        isException: false,
        deleted: false,
        edited: true
      });
    });

    return blocks;
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

                // 🔑 sacar día del backend
                const backendDay = backendDays.find(d => d.date === currentDate);

                // 🔴 DAY_OFF
                if (backendDay?.isVacation) {
                  return null;
                }

                // 🟠 EXCEPCIÓN REAL (no por vacations)
                const hasRestoreDraft = draftTurns?.some(d =>
                  d.type === 'DELETE_EXCEPTION' && d.date === currentDate
                );

                const isExceptionDay =
                  !hasRestoreDraft &&
                  backendDay?.hasException === true;
                const blocks = getBlocksForDate(currentDate);

                return blocks.map((b, idx) => {
                  console.log('🧪 BLOCK', b);
                  const start = timeToRow(b.startTime);
                  let end = timeToRow(b.endTime);
                  if (end <= start) end += 48;

                  // 🔥 CLASES CORRECTAS (mutuamente excluyentes)
                  let className = 'turn-saved';

                  if (b.isPreviewDeleted) {
                    className += ' deleted'; // ⚪ gris
                  } else if (b.deleted) {
                    className += ' deleted-exception'; // 🟠 naranja pálido
                  } else if (b.restored) {
                    className += ' restored'; // 👈 🔥 SUBE ESTO ARRIBA
                  } else if (b.isNew) {
                    className += ' new-block';
                  } else if (b.edited && !b.isBase) {
                    className += ' edited';
                  } else if (isExceptionDay) {
                    className += ' exception';
                  } else if (b.isDelete) {
                    className += ' deleted';
                  }

                  return (
                    <div
                      key={`${currentDate}-${idx}`}
                      className={className}
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