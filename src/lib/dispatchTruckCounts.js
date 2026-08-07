export function isValidTruckAssignment(truck) {
  return truck !== null && truck !== undefined && String(truck).trim() !== '';
}

export function countDispatchTrucks(dispatch, visibleTrucksOverride) {
  if (dispatch?.status === 'Cancelled') return 0;

  const trucks = visibleTrucksOverride === undefined
    ? dispatch?.trucks_assigned
    : visibleTrucksOverride;

  return Array.isArray(trucks) ? trucks.filter(isValidTruckAssignment).length : 0;
}

export function countDispatchTrucksInBucket(dispatches, getVisibleTrucks) {
  if (!Array.isArray(dispatches)) return 0;

  return dispatches.reduce((total, dispatch) => {
    const visibleTrucks = getVisibleTrucks ? getVisibleTrucks(dispatch) : undefined;
    return total + countDispatchTrucks(dispatch, visibleTrucks);
  }, 0);
}
