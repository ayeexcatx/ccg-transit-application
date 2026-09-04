import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useSession } from '@/components/session/SessionContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createBulkPending, createScheduledPendingDispatch, getAssignedTruckNumbers } from '@/services/bulkPendingService';

const invalidatePendingData = (queryClient) => Promise.all([
  queryClient.invalidateQueries({ queryKey: ['availability-summary-dispatches'] }),
  queryClient.invalidateQueries({ queryKey: ['dispatches-admin'] }),
  queryClient.invalidateQueries({ queryKey: ['portal-dispatches'] }),
  queryClient.invalidateQueries({ queryKey: ['notifications'] }),
]);

export default function BulkPendingDialog({ target, companies, dispatches, onClose }) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState({});
  const [step, setStep] = useState('select');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState([]);
  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list(),
    enabled: Boolean(target),
  });

  const rows = useMemo(() => (target?.rows || []).map((row) => {
    const company = companies.find((item) => item.id === row.companyId);
    const assigned = getAssignedTruckNumbers(dispatches, row.companyId, target.dateKey, target.shift);
    return { ...row, company, trucks: (company?.trucks || []).filter(Boolean), assigned };
  }), [companies, dispatches, target]);

  if (!target) return null;
  const selections = rows.map((row) => ({
    companyId: row.companyId,
    companyName: row.companyName,
    date: target.dateKey,
    shift: target.shift,
    trucks: selected[row.companyId] || [],
  })).filter((item) => item.trucks.length);
  const truckCount = selections.reduce((sum, item) => sum + item.trucks.length, 0);

  const toggleTruck = (row, truck) => setSelected((current) => {
    const existing = current[row.companyId] || [];
    if (existing.includes(truck)) return { ...current, [row.companyId]: existing.filter((item) => item !== truck) };
    if (existing.length >= row.remaining) return current;
    return { ...current, [row.companyId]: [...existing, truck] };
  });

  const send = async () => {
    setSending(true);
    const latestDispatches = await base44.entities.Dispatch.filter({ date: target.dateKey }, '-date', 500);
    const stillValid = selections.map((selection) => ({
      ...selection,
      trucks: selection.trucks.filter((truck) => !getAssignedTruckNumbers(
        latestDispatches, selection.companyId, selection.date, selection.shift
      ).has(truck)),
    }));
    const duplicateCount = truckCount - stillValid.reduce((sum, item) => sum + item.trucks.length, 0);
    const nextResults = await createBulkPending({
      selections: stillValid,
      createPending: (data) => createScheduledPendingDispatch({
        data, session, accessCodes, companies,
        notifyDriveSyncWarning: (message) => toast.warning(message),
      }),
    });
    if (duplicateCount) nextResults.push({ companyName: 'Already scheduled trucks', ok: false, error: new Error(`${duplicateCount} selected truck(s) became unavailable.`) });
    setResults(nextResults);
    setSending(false);
    setStep('result');
    await invalidatePendingData(queryClient);
  };

  const successes = results.filter((result) => result.ok);
  const failures = results.filter((result) => !result.ok);
  const context = `${format(target.date, 'EEEE, MMM d')} • ${target.shift} Shift`;

  return (
    <Dialog open onOpenChange={(open) => !open && !sending && onClose()}>
      <DialogContent className="flex max-h-[95vh] w-[calc(100%-1rem)] max-w-2xl flex-col overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle>Send Pending</DialogTitle>
          <DialogDescription>{context}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {step === 'select' && rows.map((row) => (
            <section key={row.companyId} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><h3 className="font-semibold text-slate-900">{row.companyName}</h3><p className="text-xs text-slate-500">{row.total} available • {row.dispatched} used • {row.remaining} remaining</p></div>
                <span className="text-xs font-medium text-sky-700">{(selected[row.companyId] || []).length} selected</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {row.trucks.map((truck) => {
                  const checked = (selected[row.companyId] || []).includes(truck);
                  const assigned = row.assigned.has(truck);
                  const atLimit = !checked && (selected[row.companyId] || []).length >= row.remaining;
                  return <label key={truck} className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
                    <Checkbox checked={checked} disabled={assigned || atLimit} onCheckedChange={() => toggleTruck(row, truck)} />
                    <span className={assigned ? 'text-slate-400' : 'font-medium'}>{truck}</span>
                    {assigned && <span className="ml-auto text-xs text-slate-500">Already scheduled</span>}
                  </label>;
                })}
                {!row.trucks.length && <p className="text-sm text-slate-500">No company trucks are configured.</p>}
              </div>
            </section>
          ))}
          {step === 'review' && selections.map((selection) => <section key={selection.companyId} className="rounded-lg bg-slate-50 p-3"><h3 className="font-semibold">{selection.companyName}</h3><p className="mt-1 text-sm text-slate-600">{selection.trucks.join(', ')}</p></section>)}
          {step === 'result' && <>
            <Alert className={failures.length ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}>
              {failures.length ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
              <AlertDescription>{successes.length} {successes.length === 1 ? 'company' : 'companies'} sent successfully. {failures.length ? `${failures.length} failed.` : ''}</AlertDescription>
            </Alert>
            {failures.map((failure, index) => <div key={`${failure.companyId}-${index}`} className="rounded-lg border border-red-200 p-3"><p className="font-medium text-red-800">{failure.companyName}</p><p className="text-sm text-red-700">{failure.error?.message || 'Pending could not be sent.'}</p></div>)}
          </>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium text-slate-600">{truckCount} trucks selected across {selections.length} companies</p>
          <div className="ml-auto flex gap-2">
            {step === 'select' && <><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!truckCount} onClick={() => setStep('review')}>Review</Button></>}
            {step === 'review' && <><Button variant="outline" onClick={() => setStep('select')}>Back</Button><Button disabled={sending} onClick={send}>{sending ? 'Sending…' : 'Send Pending'}</Button></>}
            {step === 'result' && <Button onClick={onClose}>Close</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}