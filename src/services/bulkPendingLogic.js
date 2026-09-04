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
  const validSelections = selections.filter((item) => item.trucks?.length);
  const settled = await Promise.allSettled(
    validSelections.map((selection) => createPending(buildPendingPayload(selection)))
  );
  return settled.map((result, index) => {
    const selection = validSelections[index];
    if (result.status === 'fulfilled') return { ...selection, ok: true, dispatch: result.value };
    return { ...selection, ok: false, error: result.reason };
  });
}