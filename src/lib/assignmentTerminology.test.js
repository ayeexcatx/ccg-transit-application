import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAssignmentActivityMessage, getAssignmentStatusLabel, getAssignmentTerminology, isAssignmentConfirmed } from './assignmentTerminology.js';

const dispatch = { id: 'd1', status: 'Dispatch', trucks_assigned: ['101', '102'] };

test('presents issued work as an opportunity until every relevant truck confirms', () => {
  const confirmations = [{ dispatch_id: 'd1', truck_number: '101', confirmation_type: 'Dispatch' }];
  assert.equal(isAssignmentConfirmed(dispatch, confirmations), false);
  assert.equal(getAssignmentTerminology(dispatch, confirmations).details, 'Assignment Opportunity Details');
});

test('presents fully confirmed work as an assignment', () => {
  const confirmations = [
    { dispatch_id: 'd1', truck_number: '101', confirmation_type: 'Dispatch' },
    { dispatch_id: 'd1', truck_number: '102', confirmation_type: 'Dispatch' },
  ];
  assert.equal(isAssignmentConfirmed(dispatch, confirmations), true);
  assert.equal(getAssignmentTerminology(dispatch, confirmations).view, 'View Assignment');
});

test('scheduled work remains an opportunity even if a legacy confirmation exists', () => {
  const scheduled = { ...dispatch, status: 'Scheduled' };
  const confirmations = scheduled.trucks_assigned.map((truck_number) => ({ dispatch_id: 'd1', truck_number, confirmation_type: 'Scheduled' }));
  assert.equal(isAssignmentConfirmed(scheduled, confirmations), false);
});


test('uses the concise visible status progression without changing internal statuses', () => {
  assert.equal(getAssignmentStatusLabel({ ...dispatch, status: 'Scheduled' }), 'Pending Opportunity');
  assert.equal(getAssignmentStatusLabel(dispatch), 'Opportunity');
  assert.equal(getAssignmentStatusLabel({ ...dispatch, status: 'Dispatched' }), 'Opportunity');
  assert.equal(getAssignmentStatusLabel(dispatch, [
    { dispatch_id: 'd1', truck_number: '101', confirmation_type: 'Dispatch' },
    { dispatch_id: 'd1', truck_number: '102', confirmation_type: 'Dispatch' },
  ]), 'Assignment');
  assert.equal(getAssignmentStatusLabel({ ...dispatch, status: 'Amended' }), 'Amended');
  assert.equal(getAssignmentStatusLabel({ ...dispatch, status: 'Cancelled' }), 'Canceled');
});


test('formats legacy activity messages for display without changing stored event data', () => {
  const message = 'Alex updated this dispatch and reviewed prior dispatches';
  assert.equal(
    formatAssignmentActivityMessage(message),
    'Alex updated this assignment and reviewed prior assignments'
  );
  assert.equal(message, 'Alex updated this dispatch and reviewed prior dispatches');
});

test('driver-visible work is an assignment without confirmation data or seen state', () => {
  const unseenDriverAssignment = getAssignmentTerminology(dispatch, [], ['101'], { forceAssignment: true });
  const seenDriverAssignment = getAssignmentTerminology(dispatch, [], ['101'], { forceAssignment: true });
  assert.equal(unseenDriverAssignment.singular, 'Assignment');
  assert.equal(unseenDriverAssignment.details, 'Assignment Details');
  assert.equal(unseenDriverAssignment.view, 'View Assignment');
  assert.deepEqual(seenDriverAssignment, unseenDriverAssignment);
  assert.equal(getAssignmentStatusLabel(dispatch, [], ['101'], { forceAssignment: true }), 'Assignment');
});

test('incident-selectable work is presented as an assignment by workflow guarantee', () => {
  assert.equal(getAssignmentStatusLabel(dispatch, [], null, { forceAssignment: true }), 'Assignment');
  assert.equal(getAssignmentStatusLabel({ ...dispatch, status: 'Amended' }, [], null, { forceAssignment: true }), 'Amended');
  assert.equal(getAssignmentStatusLabel({ ...dispatch, status: 'Canceled' }, [], null, { forceAssignment: true }), 'Canceled');
});

test('confirmed historical work remains an assignment when its scoped confirmations are supplied', () => {
  const historicalDispatch = { ...dispatch, archived_flag: true, date: '2024-01-01' };
  const historicalConfirmations = [
    { dispatch_id: 'd1', truck_number: '101', confirmation_type: 'Dispatch' },
    { dispatch_id: 'd1', truck_number: '102', confirmation_type: 'Dispatch' },
  ];

  assert.equal(getAssignmentStatusLabel(historicalDispatch, historicalConfirmations), 'Assignment');
  assert.equal(getAssignmentStatusLabel(historicalDispatch, []), 'Opportunity');
  assert.equal(getAssignmentStatusLabel({ ...historicalDispatch, status: 'Scheduled' }, historicalConfirmations), 'Pending Opportunity');
  assert.equal(getAssignmentStatusLabel({ ...historicalDispatch, status: 'Amended' }, []), 'Amended');
  assert.equal(getAssignmentStatusLabel({ ...historicalDispatch, status: 'Canceled' }, []), 'Canceled');
});
