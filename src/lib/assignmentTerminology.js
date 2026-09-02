const normalize = (value) => String(value ?? '').trim().toLowerCase();

export function isAssignmentConfirmed(dispatch, confirmations = [], relevantTrucks = null) {
  if (!dispatch?.id || normalize(dispatch.status) === 'scheduled') return false;

  const trucks = (Array.isArray(relevantTrucks) ? relevantTrucks : dispatch.trucks_assigned || [])
    .map((truck) => String(truck ?? '').trim())
    .filter(Boolean);
  if (trucks.length === 0) return false;

  const status = normalize(dispatch.status);
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
