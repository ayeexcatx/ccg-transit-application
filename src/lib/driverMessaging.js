export function getDriverAssignmentReceivedCopy() {
  return {
    title: 'NEW Assignment',
    message: 'You have received a new assignment.',
  };
}

export function getDriverAssignmentLifecycleCopy(status) {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized === 'amended') {
    return {
      title: 'Assignment AMENDED',
      message: 'Your assignment has been amended.',
      notificationType: 'driver_amended',
    };
  }

  if (normalized === 'cancelled' || normalized === 'canceled') {
    return {
      title: 'Assignment CANCELLED',
      message: 'Your assignment has been canceled.',
      notificationType: 'driver_cancelled',
    };
  }

  return {
    ...getDriverAssignmentReceivedCopy(),
    notificationType: 'driver_assigned',
  };
}

export function normalizeDriverSmsHeadline(title) {
  const value = String(title || '').trim();
  if (!value) return 'Assignment update';
  return value
    .replace(/assignment opportunity/gi, 'Assignment')
    .replace(/dispatch assignment/gi, 'Assignment')
    .replace(/dispatch/gi, 'Assignment')
    .replace(/\bopportunity\b/gi, 'Assignment')
    .replace(/cancelled/gi, 'Canceled');
}

export function getDriverSmsLifecycleCopy(title) {
  const normalized = normalizeDriverSmsHeadline(title).replace(/[.!?]+$/, '');
  const lower = normalized.toLowerCase();

  if (lower.includes('amended')) {
    return { headline: 'AMENDED', body: 'Your assignment has been amended.' };
  }
  if (lower.includes('cancel')) {
    return { headline: 'CANCELLED', body: 'Your assignment has been canceled.' };
  }
  if (lower.includes('removed') || lower.includes('no longer')) {
    return { headline: 'Assignment Removed', body: 'This assignment is no longer available.' };
  }
  if (lower.includes('received') || lower.includes('assigned') || lower.includes('new assignment')) {
    return { headline: 'NEW', body: 'You have received a new assignment.' };
  }
  return { headline: normalized || 'Assignment Update', body: '' };
}
