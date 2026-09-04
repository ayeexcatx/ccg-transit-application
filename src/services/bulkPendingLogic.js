export const isActiveDispatch = (dispatch) => dispatch?.status !== 'Cancelled' && dispatch?.status !== 'Completed';

export function getAssignedTruckNumbers(dispatches, companyId, date, shift) {
  return new Set((dispatches || [])
    .filter((dispatch) => isActiveDispatch(dispatch)
      && dispatch.company_id === companyId
      && dispatch.date === date
      && (dispatch.shift_time === shift || dispatch.shift_time === `${shift} Shift`))
    .flatMap((dispatch) => dispatch.trucks_assigned || []));
}

export function buildPendingPayload({ companyId, date, shift, trucks }) {
  return {
    company_id: companyId,
    date,
    shift_time: shift.endsWith(' Shift') ? shift : `${shift} Shift`,
    trucks_assigned: Array.from(new Set(trucks)).filter(Boolean),
    status: 'Scheduled',
    additional_assignments: [],
  };
}

export async function createBulkPending({ selections, createPending }) {
  const results = [];
  for (const selection of selections.filter((item) => item.trucks?.length)) {
    try {
      const dispatch = await createPending(buildPendingPayload(selection));
      results.push({ ...selection, ok: true, dispatch });
    } catch (error) {
      results.push({ ...selection, ok: false, error });
    }
  }
  return results;
}
