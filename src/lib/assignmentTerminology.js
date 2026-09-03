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

const isAssignmentOnlyAudience = (audience) => audience === 'driver' || audience === 'incident';

export function getAssignmentTerminology(dispatch, confirmations = [], relevantTrucks = null, { audience } = {}) {
  if (isAssignmentOnlyAudience(audience)) {
    return {
      confirmed: true,
      singular: 'Assignment',
      plural: 'Assignments',
      details: 'Assignment Details',
      view: 'View Assignment',
    };
  }
  const confirmed = isAssignmentConfirmed(dispatch, confirmations, relevantTrucks);
  return {
    confirmed,
    singular: confirmed ? 'Assignment' : 'Assignment Opportunity',
    plural: confirmed ? 'Assignments' : 'Assignment Opportunities',
    details: confirmed ? 'Assignment Details' : 'Assignment Opportunity Details',
    view: confirmed ? 'View Assignment' : 'View Assignment Opportunity',
  };
}


export function getAssignmentStatusLabel(dispatch, confirmations = [], relevantTrucks = null, { audience } = {}) {
  const status = normalize(dispatch?.status);
  if (status === 'amended') return 'Amended';
  if (status === 'cancelled' || status === 'canceled') return 'Canceled';
  // Driver and Incident records enter their respective workflows only after owner
  // acceptance, so confirmation rows are neither necessary nor authoritative here.
  if (isAssignmentOnlyAudience(audience)) return 'Assignment';
  if (status === 'scheduled') return 'Pending Opportunity';
  if (status === 'dispatch' || status === 'dispatched') {
    return isAssignmentConfirmed(dispatch, confirmations, relevantTrucks) ? 'Assignment' : 'Opportunity';
  }
  return dispatch?.status || 'Opportunity';
}

export function getScheduledPresentation({ audience } = {}) {
  if (isAssignmentOnlyAudience(audience)) {
    return { title: 'Assignment', message: 'Assignment details are available.', note: '' };
  }
  return {
    title: 'Pending Opportunity',
    message: 'We’ve found an assignment opportunity for your truck. Details will follow.',
    note: 'Note: The assignment is subject to cancellation by the customer. Your acknowledgement constitutes acceptance of the assignment and a commitment to perform as scheduled.',
  };
}


export function formatAssignmentActivityMessage(message) {
  if (typeof message !== 'string') return message;
  return message
    .replace(/\bdispatches\b/gi, (match) => match[0] === 'D' ? 'Assignments' : 'assignments')
    .replace(/\bdispatch\b/gi, (match) => match[0] === 'D' ? 'Assignment' : 'assignment');
}
