import { formatNotifDispatchDateTime } from '@/lib/dispatchFormatters';

export function formatNotificationDetailsMessage(message) {
  if (typeof message !== 'string') return message;

  const [dispatchDate, dispatchTime, statusSegment, ...rest] = message.split(' · ');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dispatchDate)) return message;

  const status = typeof statusSegment === 'string' ? statusSegment.split('|')[0].trim() : '';
  const formattedDateTime = formatNotifDispatchDateTime(dispatchDate, dispatchTime, status);

  return [formattedDateTime, dispatchTime, statusSegment, ...rest]
    .filter(segment => segment !== undefined)
    .join(' · ');
}
