import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPendingPayload, createBulkPending, getAssignedTruckNumbers } from './bulkPendingLogic.js';

test('builds the existing Scheduled dispatch shape with exact date, shift, and selected trucks', () => {
  assert.deepEqual(buildPendingPayload({ companyId: 'rt', date: '2026-09-04', shift: 'Day', trucks: ['RT03', 'RT04'] }), {
    company_id: 'rt', date: '2026-09-04', shift_time: 'Day Shift', trucks_assigned: ['RT03', 'RT04'], status: 'Scheduled', additional_assignments: [],
  });
});

test('creates one record per selected company and skips empty selections', async () => {
  const created = [];
  const results = await createBulkPending({
    selections: [
      { companyId: 'idr', date: '2026-09-04', shift: 'Day', trucks: ['DT02'] },
      { companyId: 'rt', date: '2026-09-04', shift: 'Day', trucks: ['RT03', 'RT04'] },
      { companyId: 'none', date: '2026-09-04', shift: 'Day', trucks: [] },
    ],
    createPending: async (payload) => { created.push(payload); return { id: String(created.length) }; },
  });
  assert.equal(results.length, 2);
  assert.equal(created.length, 2);
  assert.deepEqual(created[1].trucks_assigned, ['RT03', 'RT04']);
});

test('reports partial failure while preserving successful company results', async () => {
  const calls = [];
  const results = await createBulkPending({
    selections: [
      { companyId: 'good', companyName: 'Good Co', date: '2026-09-04', shift: 'Night', trucks: ['G1'] },
      { companyId: 'bad', companyName: 'Bad Co', date: '2026-09-04', shift: 'Night', trucks: ['B1'] },
    ],
    createPending: async (payload) => { calls.push(payload.company_id); if (payload.company_id === 'bad') throw new Error('network'); return { id: 'ok' }; },
  });
  assert.deepEqual(calls, ['good', 'bad']);
  assert.equal(results[0].ok, true);
  assert.equal(results[1].ok, false);
  assert.equal(results[1].companyName, 'Bad Co');
});

test('duplicate protection includes active assignments but permits cancelled history', () => {
  const assigned = getAssignedTruckNumbers([
    { company_id: 'rt', date: '2026-09-04', shift_time: 'Day Shift', status: 'Scheduled', trucks_assigned: ['RT03'] },
    { company_id: 'rt', date: '2026-09-04', shift_time: 'Day Shift', status: 'Cancelled', trucks_assigned: ['RT04'] },
    { company_id: 'rt', date: '2026-09-05', shift_time: 'Day Shift', status: 'Dispatch', trucks_assigned: ['RT05'] },
  ], 'rt', '2026-09-04', 'Day');
  assert.deepEqual([...assigned], ['RT03']);
});
