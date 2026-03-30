import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id } = await req.json();
    if (!company_id) {
      return Response.json({ company_name: null });
    }

    // Use service role to bypass Company read RLS and look up by ID
    const companies = await base44.asServiceRole.entities.Company.filter({ id: company_id }, '-created_date', 1);
    const company = companies?.[0];

    return Response.json({ company_name: company?.name || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});