import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getDriverAssignmentReceivedCopy, getDriverSmsLifecycleCopy, normalizeDriverSmsHeadline } from './driverMessaging.js';

test('driver assignment notification uses Assignment terminology', () => {
  const copy = getDriverAssignmentReceivedCopy();
  assert.deepEqual(copy, {
    title: 'Assignment Received',
    message: 'You have received a new assignment.',
  });
  assert.doesNotMatch(`${copy.title} ${copy.message}`, /opportunity/i);
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

  assert.equal(copies[0].headline, 'Assignment Received');
  assert.equal(copies[0].body, 'You have received a new assignment.');
  assert.equal(copies[1].headline, 'Assignment Amended');
  assert.equal(copies[2].headline, 'Assignment Canceled');
  assert.equal(copies[3].headline, 'Assignment Removed');
  assert.doesNotMatch(JSON.stringify(copies), /dispatch|opportunity|confirm|accept/i);
});
