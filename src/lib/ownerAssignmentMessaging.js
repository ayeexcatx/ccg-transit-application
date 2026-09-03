export function getCompanyOwnerNotificationTitle(status) {
  return {
    Scheduled: 'Pending',
    Dispatch: 'New',
    Dispatched: 'New',
    Amended: 'Assignment Amended',
    Cancelled: 'Assignment Canceled',
    Canceled: 'Assignment Canceled',
  }[status] || status;
}

export function buildCompanyOwnerAssignmentSms({ status, truckCount = 0, dateLine = '' }) {
  const details = dateLine || 'Assignment details are available in the app.';

  if (status === 'Scheduled') {
    const count = truckCount > 0 ? truckCount : 1;
    const truckLine = count === 1
      ? '(1) truck scheduled'
      : `(${count}) trucks scheduled`;
    return [
      'CCG Transit: Pending',
      truckLine,
      details,
      '',
      'Please open app to ACCEPT.',
    ].join('\n');
  }

  const lifecycleCopy = {
    Dispatch: ['CCG Transit: NEW', 'You have received a new assignment opportunity for:'],
    Amended: ['CCG Transit: AMENDED', 'Your assignment has been amended to:'],
    Cancelled: ['CCG Transit: CANCELLED', 'Your assignment has been canceled.'],
    Canceled: ['CCG Transit: CANCELLED', 'Your assignment has been canceled.'],
    Update: ['CCG Transit: Assignment Update', 'Your assignment has been updated:'],
  }[status];

  if (!lifecycleCopy) return '';
  return [
    lifecycleCopy[0],
    lifecycleCopy[1],
    details,
    '',
    status === 'Dispatch' ? 'Please open app to view and ACCEPT.' : 'Please open the app to view and ACCEPT.',
  ].join('\n');
}

export function getAdminAcceptanceTitle(status, ...companyNameCandidates) {
  const company = companyNameCandidates
    .find((candidate) => typeof candidate === 'string' && candidate.trim())
    ?.trim() || 'Company';
  if (status === 'Scheduled') return `${company} has accepted the pending opportunity`;
  if (status === 'Amended') return `${company} has accepted the amended assignment`;
  if (status === 'Cancelled' || status === 'Canceled') return `${company} has accepted the assignment cancellation`;
  return `${company} has accepted the assignment`;
}

export function buildAdminAcceptanceMessage({ dateText, shiftText, statusText, jobTag, assignedTrucks = [] }) {
  const lineTwo = [dateText, shiftText, statusText].filter(Boolean).join(' • ');
  const lineThree = [jobTag, assignedTrucks.join(', ')].filter(Boolean).join(' • ');
  return `${lineTwo}\n${lineThree}`;
}
