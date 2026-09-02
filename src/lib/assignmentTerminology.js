const normalize = (value) => String(value ?? '').trim().toLowerCase();

export function isAssignmentConfirmed(dispatch, confirmations = [], relevantTrucks = null) {
  if (!dispatch?.id || normalize(dispatch.status) === 'scheduled') return false;

  const trucks = (Array.isArray(relevantTrucks) ? relevantTrucks : dispatch.trucks_assigned || [])
    .map((truck) => String(truck ?? '').trim())
    .filter(Boolean);
  if (trucks.length === 0) return false;

  const status = normalize(dispatch.status) === 'dispatched' ? 'dispatch' : normalize(dispatch.status);
  const confirmedTrucks = new Set(
    confirmations
      .filter((confirmation) => (
        String(confirmation?.dispatch_id) === String(dispatch.id)
        && normalize(confirmation?.confirmation_type) === status
      ))
      .map((confirmation) => String(confirmation?.truck_number ?? '').trim())
      .filter(Boolean)
  );

  return trucks.every((truck) => confirmedTrucks.has(truck));
}

export function getAssignmentTerminology(dispatch, confirmations = [], relevantTrucks = null) {
  const confirmed = isAssignmentConfirmed(dispatch, confirmations, relevantTrucks);
  return {
    confirmed,
    singular: confirmed ? 'Assignment' : 'Assignment Opportunity',
    plural: confirmed ? 'Assignments' : 'Assignment Opportunities',
    details: confirmed ? 'Assignment Details' : 'Assignment Opportunity Details',
    view: confirmed ? 'View Assignment' : 'View Assignment Opportunity',
  };
}


export function getAssignmentStatusLabel(dispatch, confirmations = [], relevantTrucks = null) {
  const status = normalize(dispatch?.status);
  if (status === 'scheduled') return 'Pending Opportunity';
  if (status === 'amended') return 'Amended';
  if (status === 'cancelled' || status === 'canceled') return 'Canceled';
  if (status === 'dispatch' || status === 'dispatched') {
    return isAssignmentConfirmed(dispatch, confirmations, relevantTrucks) ? 'Assignment' : 'Opportunity';
  }
  return dispatch?.status || 'Opportunity';
}


export function formatAssignmentActivityMessage(message) {
  if (typeof message !== 'string') return message;
  return message
    .replace(/\bdispatches\b/gi, (match) => match[0] === 'D' ? 'Assignments' : 'assignments')
    .replace(/\bdispatch\b/gi, (match) => match[0] === 'D' ? 'Assignment' : 'assignment');
}
