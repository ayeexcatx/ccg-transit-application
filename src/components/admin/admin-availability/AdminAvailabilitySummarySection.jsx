import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AvailabilitySummaryBoxes from '@/components/availability/AvailabilitySummaryBoxes';
import { Button } from '@/components/ui/button';
import { getAdminWeekTargets, getWeekStart, moveWeek } from './adminWeeklyAvailability';

export default function AdminAvailabilitySummarySection() {
  const [today] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const targets = useMemo(() => getAdminWeekTargets(weekStart), [weekStart]);
  const weekEnd = targets[targets.length - 1].date;
  const currentWeekStart = getWeekStart(today);
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

  return (
    <section aria-labelledby="weekly-availability-heading" className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Admin planning view</p>
            <h2 id="weekly-availability-heading" className="mt-1 text-lg font-semibold text-slate-900">Weekly Availability</h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" size="sm" onClick={() => setWeekStart((start) => moveWeek(start, -1))}>
              <ChevronLeft aria-hidden="true" /> Previous Week
            </Button>
            <p className="min-w-48 text-center text-sm font-semibold text-slate-800" aria-live="polite">
              {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
            </p>
            <Button variant="outline" size="sm" onClick={() => setWeekStart((start) => moveWeek(start, 1))}>
              Next Week <ChevronRight aria-hidden="true" />
            </Button>
            <Button variant={isCurrentWeek ? 'secondary' : 'default'} size="sm" disabled={isCurrentWeek} onClick={() => setWeekStart(currentWeekStart)}>
              This Week
            </Button>
          </div>
        </div>
      </div>

      <AvailabilitySummaryBoxes
        includeAllCompanies
        variant="adminWeekly"
        targets={targets}
        referenceDate={today}
      />
    </section>
  );
}
