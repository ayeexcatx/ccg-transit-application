import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { getDateRelation, getDefaultExpandedDayKeys, toggleExpandedDay } from '@/components/admin/admin-availability/adminWeeklyAvailability';
import {
  STATUS_AVAILABLE,
  countUsedTrucksForCompanyShift,
  getAvailabilitySummaryTargets,
  getOperationalShifts,
  normalizeCount,
  resolveAvailabilityForCompanyShift,
  toDateKey } from
'./availabilityRules';

export default function AvailabilitySummaryBoxes({ companyId = null, includeAllCompanies = false, variant = 'default', referenceDate = null, targets = null }) {
  const { data: companies = [] } = useQuery({
    queryKey: ['availability-summary-companies', companyId, includeAllCompanies],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: defaults = [] } = useQuery({
    queryKey: ['availability-summary-defaults'],
    queryFn: () => base44.entities.CompanyAvailabilityDefault.list('-created_date', 5000)
  });

  const { data: overrides = [] } = useQuery({
    queryKey: ['availability-summary-overrides'],
    queryFn: () => base44.entities.CompanyAvailabilityOverride.list('-created_date', 5000)
  });

  const { data: dispatches = [] } = useQuery({
    queryKey: ['availability-summary-dispatches'],
    queryFn: () => base44.entities.Dispatch.list('-date', 1000)
  });

  const summaryData = useMemo(() => {
    const eligibleCompanies = includeAllCompanies ?
    companies :
    companies.filter((company) => company.id === companyId);

    const defaultMap = new Map();
    defaults.forEach((d) => defaultMap.set(`${d.company_id}-${d.weekday}-${d.shift}`, d));

    const overrideMap = new Map();
    overrides.forEach((o) => overrideMap.set(`${o.company_id}-${o.date}-${o.shift}`, o));

    return (targets || getAvailabilitySummaryTargets(referenceDate || new Date())).map((target) => {
      const dateKey = toDateKey(target.date);
      const isOperational = getOperationalShifts(target.date.getDay()).includes(target.shift);

      if (!isOperational) {
        return {
          ...target,
          dateKey,
          total: 0,
          dispatched: 0,
          remaining: 0,
          rows: []
        };
      }

      const rows = eligibleCompanies.
      map((company) => {
        const resolved = resolveAvailabilityForCompanyShift({
          companyId: company.id,
          date: target.date,
          shift: target.shift,
          defaultMap,
          overrideMap
        });

        if (resolved.status !== STATUS_AVAILABLE) return null;

        const total = normalizeCount(resolved.available_truck_count);
        if (!total) return null;

        const dispatched = countUsedTrucksForCompanyShift(dispatches, company.id, dateKey, target.shift);
        const remaining = Math.max(total - dispatched, 0);

        return {
          companyId: company.id,
          companyName: company.name || company.id,
          total,
          dispatched,
          remaining
        };
      }).
      filter(Boolean).
      sort((a, b) => a.companyName.localeCompare(b.companyName));

      return {
        ...target,
        dateKey,
        total: rows.reduce((sum, row) => sum + row.total, 0),
        dispatched: rows.reduce((sum, row) => sum + row.dispatched, 0),
        remaining: rows.reduce((sum, row) => sum + row.remaining, 0),
        rows
      };
    });
  }, [companies, companyId, defaults, dispatches, includeAllCompanies, overrides, referenceDate, targets]);

  const compactDefaultMap = useMemo(() => {
    const map = new Map();
    defaults.forEach((d) => map.set(`${d.company_id}-${d.weekday}-${d.shift}`, d));
    return map;
  }, [defaults]);

  const compactOverrideMap = useMemo(() => {
    const map = new Map();
    overrides.forEach((o) => map.set(`${o.company_id}-${o.date}-${o.shift}`, o));
    return map;
  }, [overrides]);

  const compactRows = useMemo(() => summaryData.map((box) => {
    const isOperational = getOperationalShifts(box.date.getDay()).includes(box.shift);
    const dayLabel = box.dateKey === toDateKey(referenceDate || new Date()) ? 'Today' : 'Tomorrow';
    const dateLabel = format(box.date, 'EEE, MMM d');
    if (!isOperational) {
      return {
        ...box,
        rowLabel: `${dayLabel} (${dateLabel}) — ${box.shift} Shift`,
        value: 'N/A'
      };
    }

    const resolved = resolveAvailabilityForCompanyShift({
      companyId,
      date: box.date,
      shift: box.shift,
      defaultMap: compactDefaultMap,
      overrideMap: compactOverrideMap
    });

    let value;
    if (resolved.status !== STATUS_AVAILABLE) {
      value = 'Unavailable';
    } else {
      const count = normalizeCount(resolved.available_truck_count);
      value = count !== null ? String(count) : '0';
    }

    return { ...box, rowLabel: `${dayLabel} (${dateLabel}) — ${box.shift} Shift`, value };
  }), [summaryData, companyId, compactDefaultMap, compactOverrideMap, referenceDate]);

  if (variant === 'ownerCompact') {
    return (
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="bg-sky-200 px-4 py-3 border-b border-slate-200/80">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Availability Snapshot</p>
            <p className="mt-1 text-sm font-semibold leading-tight text-slate-900">Number of trucks available</p>
          </div>
          <div className="bg-sky-50 px-4 py-3 space-y-2">
            {compactRows.map((row, index) =>
            <React.Fragment key={`${row.label}-${row.dateKey}-${row.shift}`}>
                {index === 2 && <div className="my-1.5 border-t border-dashed border-slate-200/90" />}
                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5">
                  <p className="text-[13px] font-medium leading-snug text-slate-700">{row.rowLabel}</p>
                  <p className="inline-flex min-w-[3rem] justify-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900">
                    {row.value}
                  </p>
                </div>
              </React.Fragment>
            )}
          </div>
        </CardContent>
      </Card>);

  }

  if (variant === 'adminWeekly') {
    const days = summaryData.reduce((groups, box) => {
      const existing = groups.find((group) => group.dateKey === box.dateKey);
      if (existing) existing.boxes.push(box);
      else groups.push({ dateKey: box.dateKey, date: box.date, boxes: [box] });
      return groups;
    }, []);

    return <AdminWeeklyBoard key={days[0]?.dateKey} days={days} referenceDate={referenceDate} />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {summaryData.map((box) =>
      <Card
        key={`${box.label}-${box.dateKey}-${box.shift}`}
        className="overflow-hidden border-slate-200 bg-white shadow-sm">
        
          <CardContent className="p-0">
            <div className="border-b border-slate-200/80 bg-slate-50/80 px-3.5 py-3">
              <p className="text-sm font-semibold leading-tight text-slate-900">{box.label}</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">{format(box.date, 'EEE, MMM d')}</p>
            </div>

            <div className="space-y-3 px-3.5 py-3">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-2.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Total</p>
                  <p className="mt-1.5 text-2xl font-semibold leading-none text-emerald-600 sm:text-3xl">{box.total}</p>
                </div>
                <div className="rounded-lg border border-sky-100 bg-sky-50/70 px-2.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Dispatched</p>
                  <p className="mt-1.5 text-2xl font-semibold leading-none text-sky-700 sm:text-3xl">{box.dispatched}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Remaining</p>
                  <p className="mt-1.5 text-2xl font-semibold leading-none text-slate-700 sm:text-3xl">{box.remaining}</p>
                </div>
              </div>

              {box.rows.length === 0 ?
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2 text-center">
                  <p className="text-[11px] font-medium text-slate-500">No counted availability</p>
                </div> :

            <ul className="space-y-1.5">
                  {box.rows.map((row) =>
              <li
                key={`${box.label}-${row.companyId}`}
                className="rounded-md bg-slate-50/70 px-2.5 py-2 text-[11px] leading-snug text-slate-600">
                
                      <span className="font-medium text-slate-700">{row.companyName}</span>
                      <span> — {row.total} total, {row.dispatched} dispatched, {row.remaining} remaining</span>
                    </li>
              )}
                </ul>
            }
            </div>
          </CardContent>
        </Card>
      )}
    </div>);

}

function AdminWeeklyBoard({ days, referenceDate }) {
  const [expandedDayKeys, setExpandedDayKeys] = useState(() =>
    getDefaultExpandedDayKeys(days[0]?.date || referenceDate || new Date(), referenceDate || new Date())
  );

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const relation = getDateRelation(day.date, referenceDate || new Date());
        const isExpanded = expandedDayKeys.has(day.dateKey);
        const contentId = `availability-day-${day.dateKey}`;
        return (
            <section
              key={day.dateKey}
              className={cn(
                'overflow-hidden rounded-xl border bg-white',
                relation === 'today' ? 'border-2 border-sky-500 bg-sky-50/30 shadow-sm' : 'border-slate-200'
              )}>
              <h3>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={contentId}
                  onClick={() => setExpandedDayKeys((current) => toggleExpandedDay(current, day.dateKey))}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 sm:px-4',
                    relation === 'today' && 'bg-sky-50/60 hover:bg-sky-50'
                  )}>
                  <span className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">{format(day.date, 'EEEE, MMM d')}</span>
                  {relation === 'today' && <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Today</span>}
                  <ChevronDown aria-hidden="true" className={cn('ml-auto size-5 shrink-0 text-slate-500 transition-transform', isExpanded && 'rotate-180')} />
                </button>
              </h3>
              {isExpanded && (
                <div id={contentId} className="grid grid-cols-1 gap-3 border-t border-slate-200 p-3 sm:p-4 md:grid-cols-2">
                  {day.boxes.map((box) => <ShiftSummaryCard key={`${box.dateKey}-${box.shift}`} box={box} />)}
                </div>
              )}
            </section>
        );
      })}
    </div>
  );
}

function ShiftSummaryCard({ box }) {
  const isNight = box.shift === 'Night';
  return (
    <Card className={cn(
      'overflow-hidden shadow-sm',
      isNight ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white'
    )}>
      <CardContent className="p-0">
        <div className={cn('border-b px-3.5 py-3', isNight ? 'border-slate-300 bg-slate-200/80' : 'border-slate-200/80 bg-white')}>
          <p className="text-sm font-semibold leading-tight text-slate-900">{box.shift} Shift</p>
        </div>
        <div className="space-y-3 px-3.5 py-3">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Metric label="Total" value={box.total} className="border-emerald-100 bg-emerald-50/70 text-emerald-600" />
            <Metric label="Dispatched" value={box.dispatched} className="border-sky-100 bg-sky-50/70 text-sky-700" />
            <Metric label="Remaining" value={box.remaining} className="border-slate-200 bg-white/80 text-slate-700" />
          </div>
          {box.rows.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-white/60 px-3 py-2 text-center">
              <p className="text-[11px] font-medium text-slate-500">No counted availability</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {box.rows.map((row) => (
                <li key={`${box.dateKey}-${box.shift}-${row.companyId}`} className="rounded-md bg-white/70 px-2.5 py-2 text-[11px] leading-snug text-slate-600">
                  <span className="font-medium text-slate-700">{row.companyName}</span>
                  <span> — {row.total} total, {row.dispatched} dispatched, {row.remaining} remaining</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, className }) {
  return (
    <div className={cn('rounded-lg border px-2.5 py-2.5', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold leading-none sm:text-3xl">{value}</p>
    </div>
  );
}
