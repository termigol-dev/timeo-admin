import { formatDateLocal } from './calendar.time';

export function useCalendarData({
  shifts,
  vacations,
  weekDates,
}) {

  // 🟢 TURNOS
  const savedTurns = shifts || [];

  // 🟡 BORRADOR (de momento vacío)
  const mergedDraftTurns = [];

  return {
    savedTurns,
    mergedDraftTurns,
    vacations, // 🔥 ahora pasamos vacations directo
  };
}