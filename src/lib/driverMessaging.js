export function getDriverAssignmentReceivedCopy() {
  return {
    title: 'Assignment Received',
    message: 'You have received a new assignment.',
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
    return { headline: 'Assignment Amended', body: 'Your assignment has been amended to:' };
  }
  if (lower.includes('cancel')) {
    return { headline: 'Assignment Canceled', body: 'Your assignment has been canceled.' };
  }
  if (lower.includes('removed') || lower.includes('no longer')) {
    return { headline: 'Assignment Removed', body: 'This assignment is no longer available.' };
  }
  if (lower.includes('received') || lower.includes('assigned') || lower.includes('new assignment')) {
    return { headline: 'Assignment Received', body: 'You have received a new assignment.' };
  }
  return { headline: normalized || 'Assignment Update', body: '' };
}
