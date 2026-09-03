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
    .replace(/\bopportunity\b/gi, 'Assignment');
}
