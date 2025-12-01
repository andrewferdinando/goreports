'use server';

import { getSupabaseServerClient } from '@/lib/supabaseServer';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ArcadeSalesData {
  product: string; // arcade_group_label (e.g., "$10 Card", "Spend $30")
  auckland: number;
  christchurch: number;
  queenstown: number;
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
// Includes: category = 'arcade'
// Groups by: location_id and arcade_group_label, summing value
// Returns: One row per product with values for each venue

export async function getArcadeSales(reportId: string): Promise<ArcadeSalesData[]> {
  const supabase = getSupabaseServerClient();

  // Query metric_values with category = 'arcade'
  const { data: metricData, error: metricError } = await supabase
    .from('metric_values')
    .select('location_id, arcade_group_label, value')
    .eq('report_id', reportId)
    .eq('category', 'arcade')
    .not('arcade_group_label', 'is', null);

  if (metricError) {
    throw new Error(`Failed to fetch arcade sales: ${metricError.message}`);
  }

  if (!metricData || metricData.length === 0) {
    return [];
  }

  // Get unique location IDs
  const locationIds = [...new Set(metricData.map((m) => m.location_id as string).filter(Boolean))];

  if (locationIds.length === 0) {
    return [];
  }

  // Fetch locations to get names and codes
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, name, code')
    .in('id', locationIds);

  if (locationsError) {
    throw new Error(`Failed to fetch locations: ${locationsError.message}`);
  }

  // Create location maps
  const locationNameMap = new Map<string, string>(); // id -> name
  const locationCodeMap = new Map<string, string>(); // id -> code
  for (const location of locations || []) {
    locationNameMap.set(location.id as string, location.name as string);
    locationCodeMap.set(location.id as string, location.code as string);
  }

  // Group by arcade_group_label and location_id, summing value
  // Structure: product -> locationCode -> total
  const productLocationMap = new Map<string, Map<string, number>>();

  for (const row of metricData) {
    const locationId = row.location_id as string;
    const arcadeLabel = row.arcade_group_label as string;
    const value = (row.value as number) || 0;

    if (!locationId || !arcadeLabel) continue;

    const locationCode = locationCodeMap.get(locationId);
    if (!locationCode) continue;

    // Initialize product if needed
    if (!productLocationMap.has(arcadeLabel)) {
      productLocationMap.set(arcadeLabel, new Map());
    }

    const locationMap = productLocationMap.get(arcadeLabel)!;
    locationMap.set(locationCode, (locationMap.get(locationCode) || 0) + value);
  }

  // Convert to array format with venue columns
  const result: ArcadeSalesData[] = Array.from(productLocationMap.entries()).map(([product, locationMap]) => {
    return {
      product,
      auckland: locationMap.get('AKL') || 0,
      christchurch: locationMap.get('CHC') || 0,
      queenstown: locationMap.get('QT') || 0,
    };
  });

  // Sort by product label
  result.sort((a, b) => a.product.localeCompare(b.product));

  return result;
}

// ============================================================================
// Individual Arcade Tab
// ============================================================================
// Query staff_metrics with category = 'arcade'
// Aggregate values by staff_name

export async function getIndividualArcade(reportId: string): Promise<IndividualArcadeData[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('staff_metrics')
    .select('staff_name, value')
    .eq('report_id', reportId)
    .eq('category', 'arcade');

  if (error) {
    throw new Error(`Failed to fetch staff metrics: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Aggregate values by staff_name
  const totals = data.reduce((acc, row) => {
    const staffName = row.staff_name as string;
    const value = (row.value as number) || 0;
    acc[staffName] = (acc[staffName] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array format and sort by total descending
  return Object.entries(totals)
    .map(([name, total]) => ({
      name,
      total,
      locationCode: undefined, // Not needed for Individual Arcade tab
    }))
    .sort((a, b) => b.total - a.total);
}

// ============================================================================
// Combo Sales Tab
// ============================================================================
// Business rules:
// - combo_total = SUM(value) where category = 'combo'
// - non_combo_total = SUM(value) where category = 'non_combo'
// - total_sales = combo_total + non_combo_total
// - combo_rate_pct = combo_total / NULLIF(total_sales, 0)
// - arcade and other categories are excluded from denominator

export async function getLocationComboByVenue(reportId: string): Promise<LocationComboData[]> {
  const supabase = getSupabaseServerClient();

  // Query metric_values for combo and non_combo categories only
  // Exclude arcade and other categories
  const { data: metricData, error: metricError } = await supabase
    .from('metric_values')
    .select('location_id, category, value')
    .eq('report_id', reportId)
    .in('category', ['combo', 'non_combo']);

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

  // Fetch locations to get venue names
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

  // Group by location_id and sum values by category
  const locationDataMap = new Map<string, { combo: number; nonCombo: number }>();

  for (const row of metricData) {
    const locationId = row.location_id as string;
    if (!locationId) continue;

    const category = row.category as string;
    const value = (row.value as number) || 0;

    // Initialize location if needed
    if (!locationDataMap.has(locationId)) {
      locationDataMap.set(locationId, { combo: 0, nonCombo: 0 });
    }

    const locationData = locationDataMap.get(locationId)!;

    if (category === 'combo') {
      locationData.combo += value;
    } else if (category === 'non_combo') {
      locationData.nonCombo += value;
    }
  }

  // Convert to array and calculate combo_rate_pct
  const result: LocationComboData[] = Array.from(locationDataMap.entries()).map(([locationId, data]) => {
    const location = locationMap.get(locationId);
    const comboTotal = data.combo;
    const nonComboTotal = data.nonCombo;
    const totalSales = comboTotal + nonComboTotal;
    
    // combo_rate_pct = combo_total / NULLIF(total_sales, 0)
    const comboPercent = totalSales > 0 ? Math.round((comboTotal / totalSales) * 100) : 0;

    return {
      locationName: location?.name || 'Unknown',
      locationCode: location?.code || '',
      combo: comboTotal,
      nonCombo: nonComboTotal,
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
