import test from 'node:test';
import assert from 'node:assert/strict';
import { getAssignmentTerminology, isAssignmentConfirmed } from './assignmentTerminology.js';

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
