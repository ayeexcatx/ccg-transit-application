import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdminAcceptanceMessage,
  buildCompanyOwnerAssignmentSms,
  getAdminAcceptanceTitle,
  getCompanyOwnerNotificationTitle,
} from './ownerAssignmentMessaging.js';
import {
  formatOwnerDispatchMessage,
  getNotificationDisplay,
} from '../components/notifications/formatNotificationDetailsMessage.js';

test('company owner notification bell uses lifecycle-specific titles', () => {
  assert.equal(getCompanyOwnerNotificationTitle('Scheduled'), 'Pending');
  assert.equal(getCompanyOwnerNotificationTitle('Dispatch'), 'New');
  assert.equal(getCompanyOwnerNotificationTitle('Dispatched'), 'New');
  assert.equal(getCompanyOwnerNotificationTitle('Amended'), 'Assignment Amended');
  assert.equal(getCompanyOwnerNotificationTitle('Cancelled'), 'Assignment Canceled');
});

test('new owner opportunity keeps its title without repeating the status in details', () => {
  const display = getNotificationDisplay({
    title: 'Status: Dispatch',
    dispatch_status_key: 'dispatch-123:Dispatch',
    message: 'MON 09-07-2026 at 7:00 AM\nDay Shift • New • Trucks: 101',
  });

  assert.equal(display.title, 'New');
  assert.equal(display.message, 'MON 09-07-2026 at 7:00 AM\nDay Shift • Trucks: 101');
});

test('owner detail formatting still removes prior statuses and preserves other details', () => {
  assert.equal(
    formatOwnerDispatchMessage('TUE 09-08-2026 at 8:00 AM\nNight Shift • New Opportunity • Trucks: 202, 303'),
    'TUE 09-08-2026 at 8:00 AM\nNight Shift • Trucks: 202, 303',
  );
  assert.equal(
    formatOwnerDispatchMessage('WED 09-09-2026\nDay Shift • Pending Opportunity (details to follow) • 4 trucks assigned'),
    'WED 09-09-2026\nDay Shift • 4 trucks assigned',
  );
});

test('scheduled owner SMS uses grammatical singular and plural Pending copy', () => {
  const singular = buildCompanyOwnerAssignmentSms({ status: 'Scheduled', truckCount: 1, dateLine: 'MON DAY SHIFT' });
  const plural = buildCompanyOwnerAssignmentSms({ status: 'Scheduled', truckCount: 2, dateLine: 'MON DAY SHIFT' });
  assert.equal(singular, 'CCG Transit: Pending\n(1) truck scheduled\nMON DAY SHIFT\n\nPlease open app to ACCEPT.');
  assert.equal(plural, 'CCG Transit: Pending\n(2) trucks scheduled\nMON DAY SHIFT\n\nPlease open app to ACCEPT.');
});

test('owner lifecycle SMS follows Opportunity then Assignment terminology and retains Accept', () => {
  const opportunity = buildCompanyOwnerAssignmentSms({ status: 'Dispatch', dateLine: 'MON at 7:00 AM' });
  const amended = buildCompanyOwnerAssignmentSms({ status: 'Amended', dateLine: 'TUE at 8:00 AM' });
  const canceled = buildCompanyOwnerAssignmentSms({ status: 'Cancelled', dateLine: 'TUE at 8:00 AM' });
  assert.match(opportunity, /^CCG Transit: NEW/);
  assert.match(opportunity, /You have received a new assignment opportunity for:/);
  assert.match(opportunity, /ACCEPT/);
  assert.match(amended, /^CCG Transit: AMENDED/);
  assert.match(canceled, /^CCG Transit: CANCELLED/);
  assert.doesNotMatch(`${opportunity}${amended}${canceled}`, /dispatch/i);
});

test('admin pending acceptance title includes the actual company name', () => {
  assert.equal(
    getAdminAcceptanceTitle('Scheduled', 'RT Masonry, LLC'),
    'RT Masonry, LLC has accepted the pending opportunity',
  );
});

test('admin assignment acceptance title includes the actual company name', () => {
  assert.equal(
    getAdminAcceptanceTitle('Dispatch', 'RT Masonry, LLC'),
    'RT Masonry, LLC has accepted the assignment',
  );
  assert.doesNotMatch(getAdminAcceptanceTitle('Dispatch', 'RT Masonry, LLC'), /confirmed|dispatch/i);
});

test('admin acceptance title only falls back to Company when no company name resolves', () => {
  assert.equal(getAdminAcceptanceTitle('Dispatch', '', 'Acme Hauling'), 'Acme Hauling has accepted the assignment');
  assert.equal(getAdminAcceptanceTitle('Scheduled', '   ', null), 'Company has accepted the pending opportunity');
});

test('admin acceptance notification detail formatting remains unchanged', () => {
  assert.equal(
    buildAdminAcceptanceMessage({
      dateText: 'TUE 04-14-2026',
      shiftText: '7:00 AM',
      statusText: 'Pending Opportunity',
      jobTag: 'JOB-1042',
      assignedTrucks: ['TRK-12', 'TRK-44'],
    }),
    'TUE 04-14-2026 • 7:00 AM • Pending Opportunity\nJOB-1042 • TRK-12, TRK-44',
  );
});
