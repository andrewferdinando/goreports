import { getSupabaseServerClient } from '@/lib/supabaseServer';

export interface WeeklyReport {
  id: string;
  period_start: string | null;
  created_at: string;
  label?: string; // fallback for old reports without period_start
}

/**
 * Fetch all weekly reports from the reports table, ordered by period_start descending.
 */
export async function getWeeklyReports(): Promise<WeeklyReport[]> {
  const supabase = getSupabaseServerClient();

  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, period_start, created_at, label')
    .eq('type', 'weekly')
    .order('period_start', { ascending: false, nullsLast: true });

  if (error) {
    console.error('Failed to fetch weekly reports:', error);
    throw new Error(`Failed to fetch weekly reports: ${error.message}`);
  }

  return (reports || []) as WeeklyReport[];
}

