'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { ensureBaseLocations } from '@/app/(admin)/_helpers/locations';

export async function createWeeklyReport(formData: FormData) {
  const supabase = getSupabaseServerClient();

  // 1. Make sure locations exist
  const locations = await ensureBaseLocations();

  // 2. Read and validate week start date
  const periodStartRaw = String(formData.get('period_start') || '').trim();
  if (!periodStartRaw) {
    throw new Error('Week start is required');
  }

  // 3. Auto-generate end date (6 days after start)
  const start = new Date(periodStartRaw);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const period_end = end.toISOString().split('T')[0];

  // 4. Auto-generate report label
  const formattedStart = start.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const label = `w/c ${formattedStart}`;

  // 5. Insert report
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .insert({
      type: 'weekly',
      period_start: periodStartRaw,
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

  // 6. Helper: map code -> file field name
  const locationFileFields: { code: string; field: string }[] = [
    { code: 'AKL', field: 'csv_auckland' },
    { code: 'CHC', field: 'csv_christchurch' },
    { code: 'QT', field: 'csv_queenstown' },
  ];

  // 7. For each location, upload CSV (if provided) and create report_uploads row
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

  // TODO: When we later implement CSV parsing, we must:
  // - Exclude Self-serve sections completely
  // - Use only "Volume In-Store" as the quantity column
  // - Calculate combo % as: combo_qty / (combo_qty + non_combo_qty), ignoring all other category products
  // For now, just persist the uploads and redirect to the report detail page.

  // Revalidate list and redirect to report detail page
  revalidatePath('/weekly-reports');
  redirect(`/weekly-reports/${reportId}`);
}

