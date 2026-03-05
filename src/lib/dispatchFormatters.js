import { format, isValid, parse, parseISO } from 'date-fns';

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase();
}

function formatNotificationTime(timeStr) {
  if (typeof timeStr !== 'string') return '';
  const raw = timeStr.trim();
  if (!raw) return '';

  if (/\b(am|pm)\b/i.test(raw)) {
    return raw.toUpperCase();
  }

  const normalized = raw.replace(/\./g, ':');
  const patterns = ['H:mm:ss', 'HH:mm:ss', 'H:mm', 'HH:mm'];

  for (const pattern of patterns) {
    const parsed = parse(normalized, pattern, new Date());
    if (isValid(parsed)) {
      return format(parsed, 'h:mm a');
    }
  }

  return '';
}

export function formatNotifDispatchDateTime(dateStr, timeStr, status) {
  if (typeof dateStr !== 'string' || !dateStr.trim()) return dateStr;

  const parsedDate = parseISO(dateStr);
  if (!isValid(parsedDate)) return dateStr;

  const formattedDate = format(parsedDate, 'EEE MM-dd-yyyy').toUpperCase();
  const normalizedStatus = normalizeStatus(status);
  const isSchedule = normalizedStatus === 'schedule' || normalizedStatus === 'scheduled';

  if (isSchedule) return formattedDate;

  const formattedTime = formatNotificationTime(timeStr);
  return formattedTime ? `${formattedDate} at ${formattedTime}` : formattedDate;
}
