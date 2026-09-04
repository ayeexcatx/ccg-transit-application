import { runAdminDispatchMutation } from './adminDispatchMutationService.js';
import { resolveAdminDisplayNameFromSession } from '../lib/adminIdentity.js';
import { syncDispatchRecordHtml } from '../lib/dispatchDriveSync.js';
export { buildPendingPayload, createBulkPending, getAssignedTruckNumbers, isActiveDispatch } from './bulkPendingLogic.js';

export async function createScheduledPendingDispatch({ data, session, accessCodes, companies, notifyDriveSyncWarning }) {
  const adminName = resolveAdminDisplayNameFromSession(session);
  const createEntry = (_session, action, message) => ({
    timestamp: new Date().toISOString(),
    admin_session_id: session?.id || session?.code || 'unknown-session',
    admin_name: adminName,
    action,
    message,
  });

  return runAdminDispatchMutation({
    editing: null,
    data,
    session,
    accessCodes,
    companies,
    appendAdminActivityLog: (log, entries) => [...(Array.isArray(entries) ? entries : [entries]), ...(log || [])],
    buildDispatchUpdateActivityEntries: () => [],
    createAdminActivityEntry: createEntry,
    getAdminDisplayName: () => adminName,
    syncDispatchRecordHtml: ({ dispatch, previousDispatch }) => syncDispatchRecordHtml({
      dispatch,
      previousDispatch,
      companyName: companies.find((company) => company.id === dispatch.company_id)?.name || 'Unknown Company',
    }),
    notifyDriveSyncWarning,
  });
}
