'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export interface ReportUpload {
  id: string;
  venueName: string;
  filename: string;
}

/**
 * Delete a report and all related data (metric_values, staff_metrics, report_uploads, reports)
 */
export async function deleteReport(reportId: string) {
  const supabase = getSupabaseServerClient();

  // Delete in order: child tables first, then parent
  const { error: metricsError } = await supabase
    .from('metric_values')
    .delete()
    .eq('report_id', reportId);

  if (metricsError) {
    throw new Error(`Failed to delete metric_values: ${metricsError.message}`);
  }

  const { error: staffError } = await supabase
    .from('staff_metrics')
    .delete()
    .eq('report_id', reportId);

  if (staffError) {
    throw new Error(`Failed to delete staff_metrics: ${staffError.message}`);
  }

  const { error: uploadsError } = await supabase
    .from('report_uploads')
    .delete()
    .eq('report_id', reportId);

  if (uploadsError) {
    throw new Error(`Failed to delete report_uploads: ${uploadsError.message}`);
  }

  const { error: reportsError } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (reportsError) {
    throw new Error(`Failed to delete report: ${reportsError.message}`);
  }

  // Revalidate the monthly reports list
  revalidatePath('/monthly-reports');
}

/**
 * Fetch report uploads with venue names for a given report
 */
export async function getReportUploads(reportId: string): Promise<ReportUpload[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('report_uploads')
    .select(`
      id,
      report_id,
      storage_path,
      original_name,
      locations (
        id,
        name
      )
    `)
    .eq('report_id', reportId);

  if (error) {
    throw new Error(`Failed to fetch report uploads: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((upload: any) => {
    const location = upload.locations;
    const venueName = location?.name || 'Unknown';
    const filename = upload.original_name || upload.storage_path?.split('/').pop() || 'Unknown';

    return {
      id: upload.id,
      venueName,
      filename,
    };
  });
}

