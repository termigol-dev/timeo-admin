import { formatDateLocal } from './calendar.time';

export function useCalendarData({
  shifts,
  vacations,
  weekDates,
}) {

  // 🟢 TURNOS
  const savedTurns = shifts || [];

  // 🟠 VACACIONES → convertir a bloques del grid
 const weekVacationBlocks = (vacations || [])
  .filter(v => v?.date) // 🧠 seguridad
  .map(v => {

    const col = weekDates.findIndex(d =>
      formatDateLocal(d) === v.date
    );

    if (col === -1) return null;

    return {
      key: `vac-${v.date}`, // 🔥 clave consistente (como DELETE)
      col,
      date: v.date,
      source: v.source || 'backend', // 🔥 naming consistente
    };

  })
  .filter(Boolean);

  // 🟡 BORRADOR (de momento vacío)
  const mergedDraftTurns = [];

  return {
    savedTurns,
    mergedDraftTurns,
    weekVacationBlocks,
  };
}