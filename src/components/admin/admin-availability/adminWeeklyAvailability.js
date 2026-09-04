import { addDays, addWeeks, startOfDay } from 'date-fns';

export function getWeekStart(date = new Date()) {
  const start = startOfDay(date);
  return addDays(start, -start.getDay());
}

export function moveWeek(weekStart, amount) {
  return addWeeks(getWeekStart(weekStart), amount);
}

export function getAdminWeekTargets(weekStart) {
  const sunday = getWeekStart(weekStart);
  return Array.from({ length: 7 }, (_, dayOffset) => {
    const date = addDays(sunday, dayOffset);
    return ['Day', 'Night'].map((shift) => ({
      label: `${shift} Shift`,
      date,
      shift,
    }));
  }).flat();
}

export function getDateRelation(date, today = new Date()) {
  const dateKey = startOfDay(date).getTime();
  const todayKey = startOfDay(today).getTime();
  if (dateKey === todayKey) return 'today';
  return dateKey < todayKey ? 'past' : 'future';
}

export function getDefaultExpandedDayKeys(weekStart, today = new Date()) {
  const sunday = getWeekStart(weekStart);
  return new Set(
    Array.from({ length: 7 }, (_, dayOffset) => addDays(sunday, dayOffset))
      .filter((date) => getDateRelation(date, today) !== 'past')
      .map((date) => formatDateKey(date))
  );
}

export function toggleExpandedDay(expandedDayKeys, dateKey) {
  const next = new Set(expandedDayKeys);
  if (next.has(dateKey)) next.delete(dateKey);
  else next.add(dateKey);
  return next;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
