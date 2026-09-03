export function buildCompanyOwnerAssignmentSms({ status, truckCount = 0, dateLine = '' }) {
  const details = dateLine || 'Assignment details are available in the app.';

  if (status === 'Scheduled') {
    const count = truckCount > 0 ? truckCount : 1;
    const truckLine = count === 1
      ? '(1) truck has received a pending opportunity for:'
      : `(${count}) trucks have received pending opportunities for:`;
    return [
      'CCG Transit: Pending Opportunity',
      truckLine,
      details,
      '',
      'Details to follow.',
      'Please open the app to view and ACCEPT.',
    ].join('\n');
  }

  const lifecycleCopy = {
    Dispatch: ['CCG Transit: Opportunity', 'You have received a new assignment for:'],
    Amended: ['CCG Transit: Assignment Amended', 'Your assignment has been amended to:'],
    Cancelled: ['CCG Transit: Assignment Canceled', 'Your assignment has been canceled.'],
    Canceled: ['CCG Transit: Assignment Canceled', 'Your assignment has been canceled.'],
    Update: ['CCG Transit: Assignment Update', 'Your assignment has been updated:'],
  }[status];

  if (!lifecycleCopy) return '';
  return [
    lifecycleCopy[0],
    lifecycleCopy[1],
    details,
    '',
    'Please open the app to view and ACCEPT.',
  ].join('\n');
}

export function getAdminAcceptanceTitle(status, companyName = 'Company') {
  const company = companyName || 'Company';
  if (status === 'Scheduled') return `${company} has accepted the pending opportunity`;
  if (status === 'Amended') return `${company} has accepted the amended assignment`;
  if (status === 'Cancelled' || status === 'Canceled') return `${company} has accepted the assignment cancellation`;
  return `${company} has accepted the assignment`;
}
