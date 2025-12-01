import { getSupabaseServerClient } from '@/lib/supabaseServer';

export interface MonthlyReport {
  id: string;
  period_start: string | null;
  created_at: string;
  label?: string; // fallback for old reports without period_start
}

/**
 * Fetch all monthly reports from the reports table, ordered by period_start descending.
 */
export async function getMonthlyReports(): Promise<MonthlyReport[]> {
  const supabase = getSupabaseServerClient();

  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, period_start, created_at, label')
    .eq('type', 'monthly')
    .order('period_start', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Failed to fetch monthly reports:', error);
    throw new Error(`Failed to fetch monthly reports: ${error.message}`);
  }

  return (reports || []) as MonthlyReport[];
}

