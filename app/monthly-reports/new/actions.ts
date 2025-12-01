'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { ensureBaseLocations } from '@/app/(admin)/_helpers/locations';

export async function createMonthlyReport(formData: FormData) {
  const supabase = getSupabaseServerClient();

  // 1. Make sure locations exist
  const locations = await ensureBaseLocations();

  // 2. Read and validate month (format: YYYY-MM from month input)
  const periodStartRaw = String(formData.get('period_start') || '').trim();
  if (!periodStartRaw) {
    throw new Error('Month is required');
  }

  // 3. Parse month input (YYYY-MM) and set to first day of month
  const [year, month] = periodStartRaw.split('-').map(Number);
  const start = new Date(year, month - 1, 1); // month is 0-indexed in Date
  const periodStart = start.toISOString().split('T')[0];

  // 4. Calculate month end date (last day of the month)
  const end = new Date(year, month, 0); // day 0 = last day of previous month
  const period_end = end.toISOString().split('T')[0];

  // 5. Auto-generate report label (e.g. "November 2025")
  const formattedMonth = start.toLocaleDateString('en-NZ', {
    month: 'long',
    year: 'numeric',
  });
  const label = formattedMonth;

  // 6. Insert report
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .insert({
      type: 'monthly',
      period_start: periodStart,
      period_end,
      label,
      created_by: 'Mickey' // TODO: later replace with real user / config
    })
    .select()
    .single();

  if (reportError || !report) {
    console.error('Failed to create report', reportError);
    throw reportError || new Error('Failed to create report');
  }

  const reportId = report.id as string;

  // 7. Helper: map code -> file field name
  const locationFileFields: { code: string; field: string }[] = [
    { code: 'AKL', field: 'csv_auckland' },
    { code: 'CHC', field: 'csv_christchurch' },
    { code: 'QT', field: 'csv_queenstown' },
  ];

  // 8. For each location, upload CSV (if provided) and create report_uploads row
  for (const { code, field } of locationFileFields) {
    const file = formData.get(field) as File | null;

    if (!file || file.size === 0) continue;

    const location = locations.find((l: any) => l.code === code);
    if (!location) continue;

    const locationId = location.id as string;

    // Upload to Storage
    const fileExt = file.name.split('.').pop() ?? 'csv';
    const path = `${reportId}/${code}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('report-csvs')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'text/csv'
      });

    if (uploadError) {
      console.error(`Failed to upload CSV for ${code}`, uploadError);
      throw uploadError;
    }

    // Insert report_uploads row
    const { error: ruError } = await supabase
      .from('report_uploads')
      .insert({
        report_id: reportId,
        location_id: locationId,
        storage_path: path,
        original_name: file.name
      });

    if (ruError) {
      console.error(`Failed to create report_uploads for ${code}`, ruError);
      throw ruError;
    }
  }

  // Revalidate list
  revalidatePath('/monthly-reports');
  
  // Return reportId instead of redirecting so client can trigger parsing
  return { reportId };
}

