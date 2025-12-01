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

  // Get staff names to check filters
  const staffNames = [...new Set(staffData.map((s) => s.staff_name as string).filter(Boolean))];
  
  // Fetch filters for these staff names
  const { data: filters } = await supabase
    .from('staff_report_filters')
    .select('staff_name, include_in_individual_reports')
    .in('staff_name', staffNames);

  // Create a map of excluded staff names
  const excludedStaff = new Set<string>();
  (filters || []).forEach(filter => {
    if (filter.include_in_individual_reports === false) {
      excludedStaff.add(filter.staff_name as string);
    }
  });

  // Filter out excluded users (default is included if no filter exists)
  const filteredStaffData = staffData.filter(row => {
    const staffName = row.staff_name as string;
    return !excludedStaff.has(staffName);
  });

  // Get unique location IDs
  const locationIds = [...new Set(filteredStaffData.map((s) => s.location_id as string).filter(Boolean))];

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

  for (const row of filteredStaffData) {
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

  // Sort by combo rate (percentage) descending (highest % at top)
  result.sort((a, b) => b.comboRate - a.comboRate);

  return result;
}

