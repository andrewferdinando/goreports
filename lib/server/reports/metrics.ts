'use server';

import { getSupabaseServerClient } from '@/lib/supabaseServer';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ArcadeSalesData {
  label: string;
  quantity: number;
}

export interface IndividualArcadeData {
  name: string;
  total: number;
  locationCode?: string;
}

export interface LocationComboData {
  locationName: string;
  locationCode: string;
  combo: number;
  nonCombo: number;
  comboPercent: number;
  rank: number;
}

export interface IndividualComboData {
  name: string;
  comboQty: number;
  nonComboQty: number;
  comboPercent: number;
}

// ============================================================================
// Arcade Sales Tab
// ============================================================================
// Includes: category IN ('combo', 'other') AND arcade_group_label IS NOT NULL
// Groups by: location_id and arcade_group_label, summing value

export async function getArcadeSales(reportId: string): Promise<ArcadeSalesData[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('metric_values')
    .select('arcade_group_label, location_id, value')
    .eq('report_id', reportId)
    .in('category', ['combo', 'other'])
    .not('arcade_group_label', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch arcade sales: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Group by arcade_group_label (across all locations) and sum values
  const grouped = new Map<string, number>();
  for (const row of data) {
    const label = row.arcade_group_label as string;
    const qty = (row.value as number) || 0;
    grouped.set(label, (grouped.get(label) || 0) + qty);
  }

  return Array.from(grouped.entries())
    .map(([label, quantity]) => ({ label, quantity }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// ============================================================================
// Individual Arcade Tab
// ============================================================================
// Includes: category = 'combo' AND arcade_group_label IS NOT NULL
// Groups by: location_id and arcade_group_label, summing value
// Each arcade_group_label is treated as an "individual" performer

export async function getIndividualArcade(reportId: string): Promise<IndividualArcadeData[]> {
  const supabase = getSupabaseServerClient();

  const { data: metricData, error: metricError } = await supabase
    .from('metric_values')
    .select('location_id, arcade_group_label, value')
    .eq('report_id', reportId)
    .eq('category', 'combo')
    .not('arcade_group_label', 'is', null);

  if (metricError) {
    throw new Error(`Failed to fetch metric values: ${metricError.message}`);
  }

  if (!metricData || metricData.length === 0) {
    return [];
  }

  // Get unique location IDs
  const locationIds = [...new Set(metricData.map((m) => m.location_id as string).filter(Boolean))];

  if (locationIds.length === 0) {
    return [];
  }

  // Fetch locations
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, code')
    .in('id', locationIds);

  if (locationsError) {
    throw new Error(`Failed to fetch locations: ${locationsError.message}`);
  }

  // Create location map
  const locationMap = new Map<string, string>();
  for (const location of locations || []) {
    locationMap.set(location.id as string, location.code as string);
  }

  // Group by arcade_group_label (summing across all locations)
  // Each arcade_group_label becomes an "individual" entry
  const grouped = new Map<string, number>();
  for (const row of metricData) {
    const arcadeLabel = row.arcade_group_label as string;
    if (!arcadeLabel) continue;

    const qty = (row.value as number) || 0;
    grouped.set(arcadeLabel, (grouped.get(arcadeLabel) || 0) + qty);
  }

  // For location code, we'll use the location with the highest value for that arcade group
  // This is a simplification since the component expects a single locationCode
  const locationByLabel = new Map<string, string>();
  for (const row of metricData) {
    const locationId = row.location_id as string;
    const arcadeLabel = row.arcade_group_label as string;
    if (!locationId || !arcadeLabel) continue;

    const locationCode = locationMap.get(locationId) || 'Unknown';
    // Use the first location we encounter for each label (or could track max)
    if (!locationByLabel.has(arcadeLabel)) {
      locationByLabel.set(arcadeLabel, locationCode);
    }
  }

  return Array.from(grouped.entries())
    .map(([label, total]) => ({ 
      name: label, // Arcade group label as the "name" (e.g., "Spend $30")
      total, 
      locationCode: locationByLabel.get(label) 
    }))
    .sort((a, b) => b.total - a.total);
}

// ============================================================================
// Combo Sales Tab
// ============================================================================
// Includes: category = 'combo' AND arcade_group_label IS NULL
// Groups by: location_id

export async function getLocationComboByVenue(reportId: string): Promise<LocationComboData[]> {
  const supabase = getSupabaseServerClient();

  // Get combo items (arcade_group_label IS NULL) and non_combo items
  const { data: metricData, error: metricError } = await supabase
    .from('metric_values')
    .select('location_id, category, value')
    .eq('report_id', reportId)
    .or('category.eq.combo,category.eq.non_combo');

  if (metricError) {
    throw new Error(`Failed to fetch metric values: ${metricError.message}`);
  }

  if (!metricData || metricData.length === 0) {
    return [];
  }

  // Get unique location IDs
  const locationIds = [...new Set(metricData.map((m) => m.location_id as string).filter(Boolean))];

  if (locationIds.length === 0) {
    return [];
  }

  // Fetch locations
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, name, code')
    .in('id', locationIds);

  if (locationsError) {
    throw new Error(`Failed to fetch locations: ${locationsError.message}`);
  }

  // Create location map
  const locationMap = new Map<string, { name: string; code: string }>();
  for (const location of locations || []) {
    locationMap.set(location.id as string, {
      name: location.name as string,
      code: location.code as string,
    });
  }

  // Group by location
  // For combo: only count rows where category = 'combo' AND arcade_group_label IS NULL
  // For non_combo: count all non_combo rows
  const locationDataMap = new Map<string, { combo: number; nonCombo: number }>();

  // First, get all combo rows with null arcade_group_label
  const { data: comboData, error: comboError } = await supabase
    .from('metric_values')
    .select('location_id, value')
    .eq('report_id', reportId)
    .eq('category', 'combo')
    .is('arcade_group_label', null);

  if (comboError) {
    throw new Error(`Failed to fetch combo data: ${comboError.message}`);
  }

  // Initialize all locations
  for (const locationId of locationIds) {
    locationDataMap.set(locationId, { combo: 0, nonCombo: 0 });
  }

  // Sum combo values (arcade_group_label IS NULL)
  for (const row of comboData || []) {
    const locationId = row.location_id as string;
    if (!locationId) continue;

    const qty = (row.value as number) || 0;
    const locationData = locationDataMap.get(locationId);
    if (locationData) {
      locationData.combo += qty;
    }
  }

  // Sum non_combo values
  for (const row of metricData) {
    const locationId = row.location_id as string;
    if (!locationId) continue;

    const category = row.category as string;
    const qty = (row.value as number) || 0;

    if (category === 'non_combo') {
      const locationData = locationDataMap.get(locationId);
      if (locationData) {
        locationData.nonCombo += qty;
      }
    }
  }

  // Convert to array and calculate percentages
  const result: LocationComboData[] = Array.from(locationDataMap.entries()).map(([locationId, data]) => {
    const location = locationMap.get(locationId);
    const total = data.combo + data.nonCombo;
    const comboPercent = total > 0 ? Math.round((data.combo / total) * 100) : 0;

    return {
      locationName: location?.name || 'Unknown',
      locationCode: location?.code || '',
      combo: data.combo,
      nonCombo: data.nonCombo,
      comboPercent,
      rank: 0, // Will be set after sorting
    };
  });

  // Sort by combo percent descending and assign ranks
  result.sort((a, b) => b.comboPercent - a.comboPercent);
  result.forEach((item, index) => {
    item.rank = index + 1;
  });

  return result;
}

// ============================================================================
// Individual Sales Tab
// ============================================================================
// Includes: category = 'non_combo'
// Groups by: location_id and product_name
// Note: Since user_id is always null, we'll group by location and product
// The component expects individual people, so we'll return locations/products as "names"

export async function getIndividualComboPercent(reportId: string): Promise<IndividualComboData[]> {
  const supabase = getSupabaseServerClient();

  // Get non_combo items grouped by location and product
  const { data: metricData, error: metricError } = await supabase
    .from('metric_values')
    .select('location_id, product_name, category, value')
    .eq('report_id', reportId)
    .eq('category', 'non_combo');

  if (metricError) {
    throw new Error(`Failed to fetch metric values: ${metricError.message}`);
  }

  if (!metricData || metricData.length === 0) {
    return [];
  }

  // Since we only have non_combo for this tab, and the component expects combo vs non_combo,
  // we'll set comboQty to 0 and nonComboQty to the value, with comboPercent = 0
  // This maintains the component structure while showing non_combo data
  const grouped = new Map<string, { combo: number; nonCombo: number }>();

  for (const row of metricData) {
    const locationId = row.location_id as string;
    const productName = (row.product_name as string) || 'Unknown';
    const key = `${locationId}:${productName}`;
    const qty = (row.value as number) || 0;

    const existing = grouped.get(key);
    if (existing) {
      existing.nonCombo += qty;
    } else {
      grouped.set(key, { combo: 0, nonCombo: qty });
    }
  }

  return Array.from(grouped.entries()).map(([key, data]) => {
    const total = data.combo + data.nonCombo;
    const comboPercent = total > 0 ? Math.round((data.combo / total) * 100) : 0;

    // Extract location and product from key for display
    const [locationId, productName] = key.split(':');
    const name = productName; // Show product name as the "individual"

    return {
      name,
      comboQty: data.combo,
      nonComboQty: data.nonCombo,
      comboPercent,
    };
  });
}
