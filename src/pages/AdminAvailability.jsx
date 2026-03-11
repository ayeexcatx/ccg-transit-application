import React from 'react';
import { useSession } from '@/components/session/SessionContext';
import { Card, CardContent } from '@/components/ui/card';
import AvailabilityManager from '@/components/availability/AvailabilityManager';
import AvailabilitySummaryBoxes from '@/components/availability/AvailabilitySummaryBoxes';

export default function AdminAvailability() {
  const { session } = useSession();

  if (session?.code_type !== 'Admin') {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-slate-900">Availability Management</h2>
          <p className="text-sm text-slate-500 mt-2">Only admins can access this page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AvailabilitySummaryBoxes includeAllCompanies />
      <AvailabilityManager canSelectCompany />
    </div>
  );
}
