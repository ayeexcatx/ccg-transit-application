import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getDriverAssignmentLifecycleCopy, getDriverAssignmentReceivedCopy, getDriverSmsLifecycleCopy, normalizeDriverSmsHeadline } from './driverMessaging.js';

test('driver assignment notification uses Assignment terminology', () => {
  const copy = getDriverAssignmentReceivedCopy();
  assert.deepEqual(copy, {
    title: 'NEW Assignment',
    message: 'You have received a new assignment.',
  });
  assert.doesNotMatch(`${copy.title} ${copy.message}`, /opportunity/i);
});

test('driver notification lifecycle uses the exact assignment-only copy', () => {
  const copies = [
    getDriverAssignmentLifecycleCopy('Dispatch'),
    getDriverAssignmentLifecycleCopy('Amended'),
    getDriverAssignmentLifecycleCopy('Cancelled'),
  ];
  assert.equal(copies[0].title, 'NEW Assignment');
  assert.equal(copies[0].message, 'You have received a new assignment.');
  assert.equal(copies[1].title, 'Assignment AMENDED');
  assert.equal(copies[1].message, 'Your assignment has been amended.');
  assert.equal(copies[2].title, 'Assignment CANCELLED');
  assert.equal(copies[2].message, 'Your assignment has been canceled.');
  assert.doesNotMatch(JSON.stringify(copies), /dispatch|opportunity/i);
});

test('direct-send driver assignment path uses the centralized received copy', async () => {
  const source = await readFile(new URL('../services/driverAssignmentMutationService.js', import.meta.url), 'utf8');
  const sendPath = source.slice(source.indexOf('export async function sendDriverAssignment'), source.indexOf('export async function deactivateDriverAssignment'));
  assert.match(sendPath, /getDriverAssignmentReceivedCopy\(\)/);
  assert.doesNotMatch(sendPath, /Assignment Opportunity|new assignment opportunity/i);
});

test('driver SMS headlines remove legacy Opportunity and Dispatch terminology', () => {
  const headlines = [
    normalizeDriverSmsHeadline('Assignment Opportunity Received'),
    normalizeDriverSmsHeadline('Dispatch Removed'),
  ];
  headlines.forEach((headline) => {
    assert.doesNotMatch(headline, /opportunity|dispatch/i);
  });
  assert.doesNotMatch(headlines.join(' '), /confirm|accept/i);
});

test('driver SMS lifecycle copy uses Assignment and never asks the driver to accept', () => {
  const copies = [
    getDriverSmsLifecycleCopy('Assignment Opportunity Received'),
    getDriverSmsLifecycleCopy('Dispatch Amended'),
    getDriverSmsLifecycleCopy('Dispatch Cancelled'),
    getDriverSmsLifecycleCopy('Dispatch Removed'),
  ];

  assert.equal(copies[0].headline, 'NEW');
  assert.equal(copies[0].body, 'You have received a new assignment.');
  assert.equal(copies[1].headline, 'AMENDED');
  assert.equal(copies[2].headline, 'CANCELLED');
  assert.equal(copies[3].headline, 'Assignment Removed');
  assert.doesNotMatch(JSON.stringify(copies), /dispatch|opportunity|confirm|accept/i);
});
