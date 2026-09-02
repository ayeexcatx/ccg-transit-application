import test from 'node:test';
import assert from 'node:assert/strict';
import { getDriverAssignmentReceivedCopy, normalizeDriverSmsHeadline } from './driverMessaging.js';

test('driver assignment notification uses Assignment terminology', () => {
  const copy = getDriverAssignmentReceivedCopy();
  assert.deepEqual(copy, {
    title: 'Assignment Received',
    message: 'You have received a new assignment.',
  });
  assert.doesNotMatch(`${copy.title} ${copy.message}`, /opportunity/i);
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
