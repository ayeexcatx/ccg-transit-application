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
