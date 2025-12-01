'use server';

import { getSupabaseServerClient } from '@/lib/supabaseServer';

export type IndividualSalesRow = {
  locationName: string;
  staffName: string;
  comboSales: number;
  nonComboSales: number;
  totalSales: number;
  comboRate: number; // 0–1
};

/**
 * Get individual sales stats from staff_metrics table.
 * Aggregates combo and non_combo sales per staff member per location.
 * Excludes arcade category completely.
 */
export async function getIndividualSalesStats(
  reportId: string
): Promise<IndividualSalesRow[]> {
  const supabase = getSupabaseServerClient();

  // Query staff_metrics for combo and non_combo only (exclude arcade)
  const { data: staffData, error: staffError } = await supabase
    .from('staff_metrics')
    .select('location_id, staff_name, category, value')
    .eq('report_id', reportId)
    .in('category', ['combo', 'non_combo']);

  if (staffError) {
    throw new Error(`Failed to fetch staff metrics: ${staffError.message}`);
  }

  if (!staffData || staffData.length === 0) {
    return [];
  }

  // Get unique location IDs
  const locationIds = [...new Set(staffData.map((s) => s.location_id as string).filter(Boolean))];

  if (locationIds.length === 0) {
    return [];
  }

  // Fetch locations to get location names
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, name')
    .in('id', locationIds);

  if (locationsError) {
    throw new Error(`Failed to fetch locations: ${locationsError.message}`);
  }

  // Create location map
  const locationMap = new Map<string, string>();
  for (const location of locations || []) {
    locationMap.set(location.id as string, location.name as string);
  }

  // Aggregate by location_id + staff_name
  // Equivalent to: GROUP BY location_id, staff_name
  const aggregated = new Map<string, { combo: number; nonCombo: number; locationId: string; staffName: string }>();

  for (const row of staffData) {
    const locationId = row.location_id as string;
    const staffName = row.staff_name as string;
    const category = row.category as string;
    const value = (row.value as number) || 0;

    if (!locationId || !staffName) continue;

    const key = `${locationId}:${staffName}`;

    if (!aggregated.has(key)) {
      aggregated.set(key, {
        combo: 0,
        nonCombo: 0,
        locationId,
        staffName,
      });
    }

    const data = aggregated.get(key)!;
    if (category === 'combo') {
      data.combo += value;
    } else if (category === 'non_combo') {
      data.nonCombo += value;
    }
  }

  // Convert to result array and calculate totals/combo rate
  const result: IndividualSalesRow[] = [];

  for (const [key, data] of aggregated.entries()) {
    const totalSales = data.combo + data.nonCombo;

    // HAVING clause: only include rows where totalSales > 0
    if (totalSales <= 0) continue;

    const comboRate = totalSales === 0 ? 0 : data.combo / totalSales;
    const locationName = locationMap.get(data.locationId) || 'Unknown';

    result.push({
      locationName,
      staffName: data.staffName,
      comboSales: data.combo,
      nonComboSales: data.nonCombo,
      totalSales,
      comboRate,
    });
  }

  // ORDER BY total_sales DESC
  result.sort((a, b) => b.totalSales - a.totalSales);

  return result;
}

