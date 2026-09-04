import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdminWeekTargets, getDateRelation, getWeekStart, moveWeek } from './adminWeeklyAvailability.js';

test('builds every day and shift in a Sunday-through-Saturday week', () => {
  const targets = getAdminWeekTargets(new Date(2026, 8, 9, 15));
  assert.equal(targets.length, 14);
  assert.equal(targets[0].date.getDay(), 0);
  assert.equal(targets[0].shift, 'Day');
  assert.equal(targets[1].shift, 'Night');
  assert.equal(targets[12].date.getDay(), 6);
  assert.equal(targets[13].shift, 'Night');
});

test('current week initialization resolves to its Sunday', () => {
  const sunday = getWeekStart(new Date(2026, 8, 9, 15));
  assert.deepEqual([sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), sunday.getHours()], [2026, 8, 6, 0]);
});

test('previous, next, and this-week navigation move by exact weeks', () => {
  const current = getWeekStart(new Date(2026, 8, 9));
  assert.equal(moveWeek(current, -1).getDate(), 30);
  assert.equal(moveWeek(current, 1).getDate(), 13);
  assert.equal(getWeekStart(new Date(2026, 8, 9)).getTime(), current.getTime());
});

test('classifies calendar dates as past, today, or future', () => {
  const today = new Date(2026, 8, 9, 18);
  assert.equal(getDateRelation(new Date(2026, 8, 8, 23), today), 'past');
  assert.equal(getDateRelation(new Date(2026, 8, 9, 1), today), 'today');
  assert.equal(getDateRelation(new Date(2026, 8, 10, 0), today), 'future');
});
