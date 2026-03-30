import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText } from 'lucide-react';

const tollColors = {
  Authorized: 'bg-green-50 text-green-700',
  Unauthorized: 'bg-red-50 text-red-700',
  'Included in Rate': 'bg-purple-50 text-purple-700',
};

function AssignmentDetailBlock({ assignment, iconSize = 'h-4 w-4', textColor = 'text-slate-700' }) {
  return (
    <>
      {assignment.job_number && (
        <div className="flex items-center gap-2 rounded-md border border-slate-200/70 bg-slate-50/60 px-2.5 py-1.5">
          <FileText className={`${iconSize} shrink-0 text-slate-400`} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500">Job #</span>
          <Badge className="bg-slate-900 px-1.5 py-0 text-[11px] font-semibold text-white hover:bg-slate-900">
              {assignment.job_number}
          </Badge>
        </div>
      )}
      {assignment.start_time && (
        <div className={`flex items-center gap-2 text-sm ${textColor}`}>
          <Clock className={`${iconSize} text-slate-400 shrink-0`} />
          <span className="font-medium">{assignment.formatTimeToAmPm(assignment.start_time)}</span>
        </div>
      )}
      {assignment.start_location && (
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Start Location</p>
          <p className={`text-sm ${assignment.contentTextClass || 'text-slate-600'} whitespace-pre-wrap ${assignment.contentExtraClass || ''}`}>{assignment.start_location}</p>
        </div>
      )}
      {assignment.instructions && (
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Instructions</p>
          <p className={`text-sm ${assignment.contentTextClass || 'text-slate-600'} whitespace-pre-wrap ${assignment.contentExtraClass || ''}`}>{assignment.instructions}</p>
        </div>
      )}
      {assignment.notes && (
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Notes</p>
          <p className={`text-sm ${assignment.contentTextClass || 'text-slate-600'} whitespace-pre-wrap ${assignment.contentExtraClass || ''}`}>{assignment.notes}</p>
        </div>
      )}
      {assignment.toll_status && (
        <Badge className={`${tollColors[assignment.toll_status]} w-fit text-xs font-medium`}>
          Toll: {assignment.toll_status}
        </Badge>
      )}
    </>
  );
}

export default function DispatchDrawerAssignmentsSection({ dispatch, hasAdditional, formatTimeToAmPm }) {
  if (!(hasAdditional || dispatch.instructions || dispatch.notes || dispatch.toll_status || dispatch.start_time || dispatch.start_location)) {
    return null;
  }

  const primary = { ...dispatch, formatTimeToAmPm, contentTextClass: 'text-slate-700', contentExtraClass: 'leading-relaxed' };

  return (
    <section className="space-y-3">
      <div data-tour="dispatch-assignment-details" className="rounded-xl border border-slate-200/80 bg-slate-50/65 p-3 sm:p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
          {(dispatch.additional_assignments || []).length > 0 ? 'Assignment 1' : 'Assignment'}
        </p>
        <div className="mt-2.5 space-y-2.5">
          <AssignmentDetailBlock assignment={primary} />
        </div>
      </div>

      {(dispatch.additional_assignments || []).length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Additional Assignments</p>
          <div className="space-y-2.5">
            {dispatch.additional_assignments.map((assignment, i) => {
              const entry = { ...assignment, formatTimeToAmPm, contentTextClass: 'text-slate-600', contentExtraClass: '' };
              return (
                <div key={i} className={`rounded-lg border border-slate-200/80 p-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/55'}`}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Assignment {i + 2}</p>
                  <div className="space-y-2.5">
                    <AssignmentDetailBlock assignment={entry} iconSize="h-3.5 w-3.5" textColor="text-slate-700" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
