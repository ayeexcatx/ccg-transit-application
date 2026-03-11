import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun } from 'lucide-react';
import {
  VIEW_MODES,
  STATUS_AVAILABLE,
  STATUS_UNAVAILABLE,
  WEEKDAY_LABELS,
  getOperationalShifts,
  buildShiftLabel,
  getStatusClass,
  normalizeCount,
  toDateKey,
} from './availabilityRules';

const WEEKDAY_SHORT_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function AvailabilityManager({ companyId, canSelectCompany = false }) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('week');
  const [activeDate, setActiveDate] = useState(new Date());
  const [defaultEditing, setDefaultEditing] = useState(null);
  const [defaultEditStatus, setDefaultEditStatus] = useState(STATUS_AVAILABLE);
  const [defaultEditCount, setDefaultEditCount] = useState('');
  const [overrideEditingDate, setOverrideEditingDate] = useState(null);
  const [dateOverrideForm, setDateOverrideForm] = useState(null);
  const [formError, setFormError] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [adminCompanyId, setAdminCompanyId] = useState('');

  const selectedCompanyId = canSelectCompany ? adminCompanyId : companyId;

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    enabled: canSelectCompany,
  });

  const filteredCompanies = useMemo(() => {
    const term = companySearch.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((company) => (company.name || company.id || '').toLowerCase().includes(term));
  }, [companies, companySearch]);

  const { data: defaults = [] } = useQuery({
    queryKey: ['company-availability-defaults', selectedCompanyId],
    queryFn: () => base44.entities.CompanyAvailabilityDefault.filter({ company_id: selectedCompanyId }, '-created_date', 200),
    enabled: !!selectedCompanyId,
  });

  const { data: overrides = [] } = useQuery({
    queryKey: ['company-availability-overrides', selectedCompanyId],
    queryFn: () => base44.entities.CompanyAvailabilityOverride.filter({ company_id: selectedCompanyId }, '-created_date', 500),
    enabled: !!selectedCompanyId,
  });

  const upsertDefaultMutation = useMutation({
    mutationFn: async (payload) => {
      const existing = defaults.find((item) => item.weekday === payload.weekday && item.shift === payload.shift);
      if (existing) return base44.entities.CompanyAvailabilityDefault.update(existing.id, payload);
      return base44.entities.CompanyAvailabilityDefault.create(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-availability-defaults', selectedCompanyId] }),
  });

  const upsertOverrideMutation = useMutation({
    mutationFn: async (payload) => {
      const existing = overrides.find((item) => item.date === payload.date && item.shift === payload.shift);
      if (existing) return base44.entities.CompanyAvailabilityOverride.update(existing.id, payload);
      return base44.entities.CompanyAvailabilityOverride.create(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-availability-overrides', selectedCompanyId] }),
  });

  const clearOverrideMutation = useMutation({
    mutationFn: async ({ date, shift }) => {
      const existing = overrides.find((item) => item.date === date && item.shift === shift);
      if (existing) await base44.entities.CompanyAvailabilityOverride.delete(existing.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-availability-overrides', selectedCompanyId] }),
  });

  const defaultMap = useMemo(() => {
    const map = new Map();
    defaults.forEach((d) => map.set(`${d.weekday}-${d.shift}`, d));
    return map;
  }, [defaults]);

  const overrideMap = useMemo(() => {
    const map = new Map();
    overrides.forEach((o) => map.set(`${o.date}-${o.shift}`, o));
    return map;
  }, [overrides]);

  const resolveAvailability = (date, shift) => {
    const override = overrideMap.get(`${toDateKey(date)}-${shift}`);
    if (override) return override;

    const recurring = defaultMap.get(`${date.getDay()}-${shift}`);
    if (recurring) return recurring;

    return { status: STATUS_AVAILABLE, available_truck_count: null };
  };

  const openDefaultEditor = (date, shift) => {
    const initial = defaultMap.get(`${date.getDay()}-${shift}`) || { status: STATUS_AVAILABLE, available_truck_count: null };

    setDefaultEditing({ date, shift });
    setDefaultEditStatus(initial.status || STATUS_AVAILABLE);
    setDefaultEditCount(initial.available_truck_count ? String(initial.available_truck_count) : '');
    setFormError('');
  };

  const getDateEditInitialState = (date) => {
    const operationalShifts = getOperationalShifts(date.getDay());
    const createShiftState = (shift) => {
      const availability = resolveAvailability(date, shift);
      return {
        status: availability.status || STATUS_AVAILABLE,
        count: availability.available_truck_count ? String(availability.available_truck_count) : '',
        operational: operationalShifts.includes(shift),
      };
    };

    return {
      Day: createShiftState('Day'),
      Night: createShiftState('Night'),
    };
  };

  const openOverrideEditorForDate = (date) => {
    setOverrideEditingDate(date);
    setDateOverrideForm(getDateEditInitialState(date));
    setFormError('');
  };

  const saveDefaultEdit = async () => {
    if (!defaultEditing || !selectedCompanyId) return;

    const count = defaultEditStatus === STATUS_AVAILABLE ? normalizeCount(defaultEditCount) : null;
    if (defaultEditStatus === STATUS_AVAILABLE && defaultEditCount !== '' && count === null) {
      setFormError('Available truck count must be a whole number greater than 0.');
      return;
    }

    const payload = {
      company_id: selectedCompanyId,
      status: defaultEditStatus,
      available_truck_count: defaultEditStatus === STATUS_UNAVAILABLE ? null : count,
      weekday: defaultEditing.date.getDay(),
      shift: defaultEditing.shift,
    };

    await upsertDefaultMutation.mutateAsync(payload);
    setDefaultEditing(null);
  };

  const saveDateOverride = async () => {
    if (!overrideEditingDate || !selectedCompanyId || !dateOverrideForm) return;

    for (const shift of ['Day', 'Night']) {
      const shiftState = dateOverrideForm[shift];
      if (!shiftState?.operational) continue;

      const count = shiftState.status === STATUS_AVAILABLE ? normalizeCount(shiftState.count) : null;
      if (shiftState.status === STATUS_AVAILABLE && shiftState.count !== '' && count === null) {
        setFormError(`${shift} shift available truck count must be a whole number greater than 0.`);
        return;
      }
    }

    const savePromises = ['Day', 'Night'].map(async (shift) => {
      const shiftState = dateOverrideForm[shift];
      if (!shiftState?.operational) return;

      const count = shiftState.status === STATUS_AVAILABLE ? normalizeCount(shiftState.count) : null;
      await upsertOverrideMutation.mutateAsync({
        company_id: selectedCompanyId,
        status: shiftState.status,
        available_truck_count: shiftState.status === STATUS_UNAVAILABLE ? null : count,
        date: toDateKey(overrideEditingDate),
        shift,
      });
    });

    await Promise.all(savePromises);
    setOverrideEditingDate(null);
    setDateOverrideForm(null);
  };

  const clearDateOverrides = async (date) => {
    await Promise.all(
      ['Day', 'Night'].map((shift) => clearOverrideMutation.mutateAsync({ date: toDateKey(date), shift }))
    );
    setOverrideEditingDate(null);
    setDateOverrideForm(null);
  };

  const updateOverrideShiftField = (shift, field, value) => {
    setDateOverrideForm((prev) => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        [field]: value,
        ...(field === 'status' && value === STATUS_UNAVAILABLE ? { count: '' } : {}),
      },
    }));
  };

  const getCompactShiftDisplay = (date, shift) => {
    if (!getOperationalShifts(date.getDay()).includes(shift)) {
      return { label: 'N/A', className: 'text-slate-400' };
    }

    const availability = resolveAvailability(date, shift);
    if (availability.status === STATUS_UNAVAILABLE) {
      return { label: 'Unavail', className: getStatusClass(availability.status) };
    }

    if (availability.available_truck_count) {
      return { label: String(availability.available_truck_count), className: getStatusClass(availability.status) };
    }

    return { label: 'Avail', className: getStatusClass(availability.status) };
  };

  const shiftActiveDate = (direction) => {
    if (viewMode === 'day') return setActiveDate((prev) => addDays(prev, direction));
    if (viewMode === 'week') return setActiveDate((prev) => addWeeks(prev, direction));
    return setActiveDate((prev) => addMonths(prev, direction));
  };

  const dateRangeLabel = useMemo(() => {
    if (viewMode === 'day') return format(activeDate, 'EEE, MMM d, yyyy');
    if (viewMode === 'week') {
      const start = startOfWeek(activeDate, { weekStartsOn: 0 });
      const end = endOfWeek(activeDate, { weekStartsOn: 0 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    return format(activeDate, 'MMMM yyyy');
  }, [activeDate, viewMode]);

  const visibleDates = useMemo(() => {
    if (viewMode === 'day') {
      return eachDayOfInterval({ start: addDays(activeDate, -1), end: addDays(activeDate, 1) });
    }

    if (viewMode === 'week') {
      const start = startOfWeek(activeDate, { weekStartsOn: 0 });
      const end = endOfWeek(activeDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }

    const monthStart = startOfMonth(activeDate);
    const monthEnd = endOfMonth(activeDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [activeDate, viewMode]);

  const renderCompactCalendarDayCell = (date, weekIndex) => {
    const key = `${toDateKey(date)}-${weekIndex}`;
    const isOutsideActiveMonth = viewMode === 'month' && !isSameMonth(date, activeDate);
    const dayDisplay = getCompactShiftDisplay(date, 'Day');
    const nightDisplay = getCompactShiftDisplay(date, 'Night');

    return (
      <button
        key={key}
        type="button"
        onClick={() => openOverrideEditorForDate(date)}
        className={`min-w-0 rounded border p-1 text-left transition-colors ${
          isOutsideActiveMonth ? 'bg-slate-50/70 border-slate-200' : 'bg-white border-slate-300'
        } hover:bg-slate-50`}
      >
        <p className={`text-[10px] font-semibold leading-tight ${isOutsideActiveMonth ? 'text-slate-400' : 'text-slate-700'}`}>
          {format(date, 'd')}
        </p>
        <div className="mt-1 space-y-0.5 text-[10px] leading-tight">
          <p className={dayDisplay.className}>{dayDisplay.label}</p>
          <p className={nightDisplay.className}>{nightDisplay.label}</p>
        </div>
      </button>
    );
  };

  const renderCalendarWeekRow = (weekDates, weekIndex) => (
    <div key={`week-${weekIndex}`} className="grid grid-cols-[24px_repeat(7,minmax(0,1fr))] gap-1">
      <div className="flex flex-col items-center justify-center text-slate-500">
        <Sun className="h-3 w-3 text-amber-500" />
        <Moon className="mt-2 h-3 w-3 text-slate-500" />
      </div>
      {weekDates.map((date) => renderCompactCalendarDayCell(date, weekIndex))}
    </div>
  );

  const renderDayCardCell = (date) => {
    const shifts = getOperationalShifts(date.getDay());

    if (!shifts.length) {
      return (
        <Card key={toDateKey(date)}>
          <CardContent className="p-3">
            <p className="font-medium text-sm">{format(date, 'EEE, MMM d')}</p>
            <p className="text-xs text-slate-400 mt-2">Non-operational day</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={toDateKey(date)}>
        <CardContent className="p-3 space-y-2">
          <p className="font-medium text-sm">{format(date, 'EEE, MMM d')}</p>
          {shifts.map((shift) => {
            const availability = resolveAvailability(date, shift);
            return (
              <button
                key={shift}
                type="button"
                onClick={() => openOverrideEditorForDate(date)}
                className="w-full rounded border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-600">{shift}</span>
                  <span className={`text-xs font-semibold ${getStatusClass(availability.status)}`}>
                    {buildShiftLabel(availability)}
                  </span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Availability</h2>
          <p className="text-sm text-slate-500">Manage company-level shift availability.</p>
        </div>
        <div className="flex items-center gap-2">
          {VIEW_MODES.map((mode) => (
            <Button key={mode} variant={viewMode === mode ? 'default' : 'outline'} size="sm" onClick={() => setViewMode(mode)}>
              {mode[0].toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      {canSelectCompany && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Search companies</p>
              <Input
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Type a company name"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Company</p>
              <Select value={selectedCompanyId || ''} onValueChange={setAdminCompanyId}>
                <SelectTrigger className="w-full md:w-[360px]">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>{company.name || company.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedCompanyId ? (
        <Card><CardContent className="p-6 text-sm text-slate-500">Select a company to view availability.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium text-slate-700">{dateRangeLabel}</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => shiftActiveDate(-1)}>Prev</Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveDate(new Date())}>Today</Button>
                  <Button size="sm" variant="outline" onClick={() => shiftActiveDate(1)}>Next</Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {(viewMode === 'week' || viewMode === 'month') && (
                  <div className="space-y-1 min-w-0">
                    <div className="grid grid-cols-[24px_repeat(7,minmax(0,1fr))] gap-1">
                      <div />
                      {WEEKDAY_SHORT_LABELS.map((weekday, index) => (
                        <p key={`${weekday}-${index}`} className="text-[10px] text-center font-semibold text-slate-500">{weekday}</p>
                      ))}
                    </div>

                    {viewMode === 'week' && renderCalendarWeekRow(visibleDates, 0)}
                    {viewMode === 'month' && Array.from({ length: Math.ceil(visibleDates.length / 7) }).map((_, weekIndex) => {
                      const start = weekIndex * 7;
                      const weekDates = visibleDates.slice(start, start + 7);
                      return renderCalendarWeekRow(weekDates, weekIndex);
                    })}
                  </div>
                )}

                {viewMode === 'day' && (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    {visibleDates.map(renderDayCardCell)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-slate-500">
            <Badge variant="outline" className="mr-2 text-green-700 border-green-300">Available</Badge>
            <Badge variant="outline" className="text-red-700 border-red-300">Unavailable</Badge>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">Recurring Weekly Defaults</h3>
              <p className="text-xs text-slate-500">Defaults apply when no date-specific override exists.</p>
              <div className="grid gap-2 md:grid-cols-2">
                {[1, 2, 3, 4, 5, 0].map((weekday) => (
                  getOperationalShifts(weekday).map((shift) => {
                    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekday === 0 ? 6 : weekday - 1);
                    const availability = defaultMap.get(`${weekday}-${shift}`) || { status: STATUS_AVAILABLE, available_truck_count: null };
                    return (
                      <button
                        key={`${weekday}-${shift}`}
                        type="button"
                        onClick={() => openDefaultEditor(date, shift)}
                        className="rounded border border-slate-200 p-2 text-left hover:bg-slate-50"
                      >
                        <p className="text-xs text-slate-500">{WEEKDAY_LABELS[weekday]} · {shift}</p>
                        <p className={`text-sm font-semibold ${getStatusClass(availability.status)}`}>{buildShiftLabel(availability)}</p>
                      </button>
                    );
                  })
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        open={!!defaultEditing || !!overrideEditingDate}
        onOpenChange={(open) => {
          if (!open) {
            setDefaultEditing(null);
            setOverrideEditingDate(null);
            setDateOverrideForm(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{defaultEditing ? 'Edit weekly default' : 'Edit day override'}</DialogTitle>
          </DialogHeader>

          {defaultEditing && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">{format(defaultEditing.date, 'EEE, MMM d, yyyy')} · {defaultEditing.shift} Shift</p>
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <Select
                  value={defaultEditStatus}
                  onValueChange={(value) => {
                    setDefaultEditStatus(value);
                    if (value === STATUS_UNAVAILABLE) setDefaultEditCount('');
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={STATUS_AVAILABLE}>Available</SelectItem>
                    <SelectItem value={STATUS_UNAVAILABLE}>Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {defaultEditStatus === STATUS_AVAILABLE && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Available Trucks (optional)</p>
                  <Input
                    type="number"
                    min="1"
                    value={defaultEditCount}
                    onChange={(e) => setDefaultEditCount(e.target.value)}
                    placeholder="Leave blank for general availability"
                  />
                </div>
              )}

              {formError && <p className="text-xs text-red-600">{formError}</p>}

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => { setDefaultEditing(null); setFormError(''); }}>Cancel</Button>
                <Button onClick={saveDefaultEdit}>Save</Button>
              </div>
            </div>
          )}

          {!defaultEditing && overrideEditingDate && dateOverrideForm && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">{format(overrideEditingDate, 'EEE, MMM d, yyyy')}</p>

              {['Day', 'Night'].map((shift) => {
                const shiftState = dateOverrideForm[shift];
                return (
                  <div key={shift} className="space-y-2 rounded border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-700">{shift} Shift</p>
                    {!shiftState.operational ? (
                      <p className="text-xs text-slate-400">N/A (non-operational for this date)</p>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Status</p>
                          <Select
                            value={shiftState.status}
                            onValueChange={(value) => updateOverrideShiftField(shift, 'status', value)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value={STATUS_AVAILABLE}>Available</SelectItem>
                              <SelectItem value={STATUS_UNAVAILABLE}>Unavailable</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {shiftState.status === STATUS_AVAILABLE && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Available Trucks (optional)</p>
                            <Input
                              type="number"
                              min="1"
                              value={shiftState.count}
                              onChange={(e) => updateOverrideShiftField(shift, 'count', e.target.value)}
                              placeholder="Leave blank for general availability"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              {formError && <p className="text-xs text-red-600">{formError}</p>}

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => clearDateOverrides(overrideEditingDate)}>Use Weekly Default</Button>
                <Button variant="outline" onClick={() => { setOverrideEditingDate(null); setDateOverrideForm(null); setFormError(''); }}>Cancel</Button>
                <Button onClick={saveDateOverride}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
