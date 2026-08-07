import test from 'node:test';
import assert from 'node:assert/strict';

import {
  countDispatchTrucks,
  countDispatchTrucksInBucket,
} from './dispatchTruckCounts.js';

test('counts valid assigned truck slots without deduplicating them', () => {
  assert.equal(countDispatchTrucks({
    status: 'Dispatch',
    trucks_assigned: ['101', '', null, '102', ' ', undefined, '101'],
  }), 3);
});

test('cancelled dispatches contribute zero but remain in the supplied bucket', () => {
  const bucket = [
    { status: 'Dispatch', trucks_assigned: ['101', '102', '103'] },
    { status: 'Completed', trucks_assigned: ['205', '206'] },
    { status: 'Cancelled', trucks_assigned: ['301', '302', '303', '304'] },
  ];

  assert.equal(bucket.length, 3);
  assert.equal(countDispatchTrucksInBucket(bucket), 5);
  assert.equal(countDispatchTrucksInBucket([bucket[2]]), 0);
  assert.equal(countDispatchTrucksInBucket([]), 0);
});

test('uses the supplied driver-visible truck collection instead of all assigned trucks', () => {
  const dispatches = [
    { id: 'a', status: 'Dispatch', trucks_assigned: ['101', '102', '103'] },
    { id: 'b', status: 'Dispatch', trucks_assigned: ['201', '202', '203'] },
    { id: 'c', status: 'Cancelled', trucks_assigned: ['301'] },
  ];
  const visibleTrucks = new Map([
    ['a', ['102']],
    ['b', ['201', '202', ' ', null]],
    ['c', ['301']],
  ]);

  assert.equal(
    countDispatchTrucksInBucket(dispatches, (dispatch) => visibleTrucks.get(dispatch.id) || []),
    3,
  );
});
