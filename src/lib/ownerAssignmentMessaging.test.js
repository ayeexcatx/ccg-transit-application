import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCompanyOwnerAssignmentSms, getAdminAcceptanceTitle } from './ownerAssignmentMessaging.js';

test('scheduled owner SMS uses grammatical singular and plural Pending Opportunity copy', () => {
  const singular = buildCompanyOwnerAssignmentSms({ status: 'Scheduled', truckCount: 1, dateLine: 'MON DAY SHIFT' });
  const plural = buildCompanyOwnerAssignmentSms({ status: 'Scheduled', truckCount: 2, dateLine: 'MON DAY SHIFT' });
  assert.match(singular, /^CCG Transit: Pending Opportunity\n\(1\) truck has received a pending opportunity for:/);
  assert.match(plural, /\(2\) trucks have received pending opportunities for:/);
  assert.doesNotMatch(`${singular}${plural}`, /has been scheduled/i);
});

test('owner lifecycle SMS follows Opportunity then Assignment terminology and retains Accept', () => {
  const opportunity = buildCompanyOwnerAssignmentSms({ status: 'Dispatch', dateLine: 'MON at 7:00 AM' });
  const amended = buildCompanyOwnerAssignmentSms({ status: 'Amended', dateLine: 'TUE at 8:00 AM' });
  const canceled = buildCompanyOwnerAssignmentSms({ status: 'Cancelled', dateLine: 'TUE at 8:00 AM' });
  assert.match(opportunity, /^CCG Transit: Opportunity/);
  assert.match(opportunity, /You have received a new assignment for:/);
  assert.match(opportunity, /ACCEPT/);
  assert.match(amended, /^CCG Transit: Assignment Amended/);
  assert.match(canceled, /^CCG Transit: Assignment Canceled/);
  assert.doesNotMatch(`${opportunity}${amended}${canceled}`, /dispatch/i);
});

test('admin acceptance copy reflects the accepted business stage', () => {
  assert.equal(getAdminAcceptanceTitle('Scheduled', 'Acme'), 'Acme has accepted the pending opportunity');
  assert.equal(getAdminAcceptanceTitle('Dispatch', 'Acme'), 'Acme has accepted the assignment');
  assert.doesNotMatch(getAdminAcceptanceTitle('Dispatch', 'Acme'), /confirmed|dispatch/i);
});
