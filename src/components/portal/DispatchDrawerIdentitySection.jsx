import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Pencil, Truck } from 'lucide-react';
import { scheduledDispatchNote, scheduledStatusMessage } from './statusConfig';

export default function DispatchDrawerIdentitySection({
  dispatch,
  isAdmin,
  isOwner,
  visibleTrucks,
  getTruckDriverSummaryLabel,
  hasTruckSeenStatus,
  isEditingTrucks,
  onToggleEditingTrucks,
  requiredTruckCount,
  ownerTruckOptions,
  draftTrucks,
  toggleDraftTruck,
  truckEditMessage,
  hasTruckDraftChanges,
  isSavingTrucks,
  onSaveTrucks,
}) {
  if (dispatch.status === 'Scheduled') {
    return (
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Scheduled Dispatch</h2>
        <p className="text-sm text-blue-600 mt-1 italic">{scheduledStatusMessage}</p>
        <p className="text-xs text-slate-600 mt-2 italic">{scheduledDispatchNote}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200/70 bg-slate-50/60 px-3.5 py-2.5 sm:px-4">
        {dispatch.client_name && (
          <h2 className="text-lg font-semibold leading-tight text-slate-900 sm:text-[1.15rem]">{dispatch.client_name}</h2>
        )}
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] text-slate-500">
          <Building2 className="h-3.5 w-3.5 text-slate-400/90" />
          <span className="uppercase">Working for CCG Transit</span>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200/80 bg-white/95 p-3 sm:p-3.5">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Assignment Summary</p>
          {isOwner && (
            <Button
              type="button"
              data-screenshot-exclude="true"
              variant="outline"
              size="sm"
              className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
              data-tour="dispatch-edit-trucks"
              onClick={onToggleEditingTrucks}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              {isEditingTrucks ? 'Cancel' : 'Edit Trucks'}
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100/80">
              <Truck className="h-3.5 w-3.5 text-slate-500" />
            </div>
            {(isAdmin || isOwner) ? (
              <div className="min-w-0 flex-1 space-y-1.5">
                {visibleTrucks.map((t) => {
                  const truckDriverSummaryLabel = getTruckDriverSummaryLabel(t);

                  return (
                    <div key={t} className="flex items-start gap-2 rounded-md border border-slate-200/80 bg-slate-50/50 px-2.5 py-1.5">
                      <Badge variant="outline" className="shrink-0 border-slate-700/80 bg-white text-[11px] font-semibold text-slate-800">
                        {t}
                      </Badge>
                      {truckDriverSummaryLabel && (
                        <span className="min-w-0 break-words text-xs leading-5 text-slate-600">
                          {truckDriverSummaryLabel}
                        </span>
                      )}
                      {hasTruckSeenStatus(t) && (
                        <Badge className="border border-emerald-200/80 bg-emerald-50/70 px-1.5 py-0 text-[10px] font-semibold text-emerald-700">
                          Seen
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {visibleTrucks.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs border-slate-900 text-slate-900 font-semibold w-fit">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {isOwner && isEditingTrucks && (
            <div data-screenshot-exclude="true" className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
              <p className="text-xs text-slate-500">
                Select assigned trucks. You must keep exactly {requiredTruckCount} truck{requiredTruckCount === 1 ? '' : 's'}.
              </p>
              <div className="space-y-2">
                {ownerTruckOptions.map((truck) => (
                  <label key={truck} className="flex items-center gap-2 text-sm text-slate-700">
                    <Checkbox
                      checked={draftTrucks.includes(truck)}
                      disabled={!draftTrucks.includes(truck) && draftTrucks.filter(Boolean).length >= requiredTruckCount}
                      onCheckedChange={() => toggleDraftTruck(truck)}
                    />
                    <span className="font-mono">{truck}</span>
                  </label>
                ))}
              </div>
              {truckEditMessage?.text && (
                <div className="rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700">
                  {truckEditMessage.text}
                </div>
              )}
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!hasTruckDraftChanges || isSavingTrucks || draftTrucks.filter(Boolean).length !== requiredTruckCount}
                onClick={onSaveTrucks}
              >
                {isSavingTrucks ? 'Saving…' : 'Save Truck Assignments'}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
