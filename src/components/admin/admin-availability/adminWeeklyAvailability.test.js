import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAdminWeekTargets,
  getDateRelation,
  getDefaultExpandedDayKeys,
  getWeekStart,
  moveWeek,
  toggleExpandedDay,
} from './adminWeeklyAvailability.js';

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

test('defaults past days closed and today and future days open in the current week', () => {
  const today = new Date(2026, 8, 9, 18);
  const expanded = getDefaultExpandedDayKeys(getWeekStart(today), today);

  assert.deepEqual([...expanded], ['2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12']);
  assert.equal(expanded.has('2026-09-08'), false);
  assert.equal(expanded.has('2026-09-09'), true);
  assert.equal(expanded.has('2026-09-10'), true);
});

test('defaults all days open for a future week', () => {
  const expanded = getDefaultExpandedDayKeys(new Date(2026, 8, 13), new Date(2026, 8, 9));
  assert.equal(expanded.size, 7);
});

test('defaults all days closed for a historical week', () => {
  const expanded = getDefaultExpandedDayKeys(new Date(2026, 7, 30), new Date(2026, 8, 9));
  assert.equal(expanded.size, 0);
});

test('toggles a day independently without mutating the prior state', () => {
  const initial = new Set(['2026-09-09']);
  const closed = toggleExpandedDay(initial, '2026-09-09');
  const reopened = toggleExpandedDay(closed, '2026-09-09');

  assert.equal(initial.has('2026-09-09'), true);
  assert.equal(closed.has('2026-09-09'), false);
  assert.equal(reopened.has('2026-09-09'), true);
});

test('week navigation and This Week recalculate defaults for the selected week', () => {
  const today = new Date(2026, 8, 9);
  const currentWeek = getWeekStart(today);
  const manuallyChanged = toggleExpandedDay(getDefaultExpandedDayKeys(currentWeek, today), '2026-09-06');
  assert.equal(manuallyChanged.has('2026-09-06'), true);

  const previousDefaults = getDefaultExpandedDayKeys(moveWeek(currentWeek, -1), today);
  const nextDefaults = getDefaultExpandedDayKeys(moveWeek(currentWeek, 1), today);
  const thisWeekDefaults = getDefaultExpandedDayKeys(currentWeek, today);

  assert.equal(previousDefaults.size, 0);
  assert.equal(nextDefaults.size, 7);
  assert.deepEqual([...thisWeekDefaults], ['2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12']);
  assert.equal(thisWeekDefaults.has('2026-09-06'), false);
});
