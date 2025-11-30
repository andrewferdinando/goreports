'use server';

import { getSupabaseServerClient } from '@/lib/supabaseServer';

export interface ArcadeSalesData {
  label: string;
  quantity: number;
}

export interface IndividualArcadeData {
  name: string;
  total: number;
  locationCode?: string;
}

export interface LocationComboBreakdown {
  combo: number;
  nonCombo: number;
  comboPercent: number;
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

export async function getArcadeSales(reportId: string): Promise<ArcadeSalesData[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('metric_values')
    .select('arcade_group_label, quantity')
    .eq('report_id', reportId)
    .not('arcade_group_label', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch arcade sales: ${error.message}`);
  }

  // Group by arcade_group_label and sum quantities
  const grouped = new Map<string, number>();
  for (const row of data || []) {
    const label = row.arcade_group_label as string;
    const qty = (row.quantity as number) || 0;
    grouped.set(label, (grouped.get(label) || 0) + qty);
  }

  return Array.from(grouped.entries())
    .map(([label, quantity]) => ({ label, quantity }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getIndividualArcade(reportId: string): Promise<IndividualArcadeData[]> {
  const supabase = getSupabaseServerClient();

  const { data: metricData, error: metricError } = await supabase
    .from('metric_values')
    .select('user_id, location_id, quantity')
    .eq('report_id', reportId)
    .not('arcade_group_label', 'is', null);

  if (metricError) {
    throw new Error(`Failed to fetch metric values: ${metricError.message}`);
  }

  if (!metricData || metricData.length === 0) {
    return [];
  }

  // Get unique user IDs and location IDs
  const userIds = [...new Set(metricData.map((m) => m.user_id as string).filter(Boolean))];
  const locationIds = [...new Set(metricData.map((m) => m.location_id as string).filter(Boolean))];

  if (userIds.length === 0) {
    return [];
  }

  // Fetch users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, location_id')
    .in('id', userIds);

  if (usersError) {
    throw new Error(`Failed to fetch users: ${usersError.message}`);
  }

  // Fetch locations
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, code')
    .in('id', locationIds);

  if (locationsError) {
    throw new Error(`Failed to fetch locations: ${locationsError.message}`);
  }

  // Create maps
  const userMap = new Map<string, { name: string; locationId: string }>();
  for (const user of users || []) {
    userMap.set(user.id as string, {
      name: user.name as string,
      locationId: user.location_id as string,
    });
  }

  const locationMap = new Map<string, string>();
  for (const location of locations || []) {
    locationMap.set(location.id as string, location.code as string);
  }

  // Group by user name and sum quantities, track location
  const grouped = new Map<string, { total: number; locationCode: string }>();
  for (const row of metricData) {
    const userId = row.user_id as string;
    const locationId = row.location_id as string;
    if (!userId) continue;
    
    const user = userMap.get(userId);
    if (!user) continue;
    
    const userName = user.name;
    const locationCode = locationMap.get(locationId) || '';
    const qty = (row.quantity as number) || 0;
    
    const existing = grouped.get(userName);
    if (existing) {
      existing.total += qty;
    } else {
      grouped.set(userName, { total: qty, locationCode });
    }
  }

  return Array.from(grouped.entries())
    .map(([name, data]) => ({ name, total: data.total, locationCode: data.locationCode }))
    .sort((a, b) => b.total - a.total);
}

export async function getLocationComboBreakdown(reportId: string): Promise<LocationComboBreakdown> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('metric_values')
    .select('category, quantity')
    .eq('report_id', reportId)
    .in('category', ['combo', 'non_combo']);

  if (error) {
    throw new Error(`Failed to fetch location combo breakdown: ${error.message}`);
  }

  let combo = 0;
  let nonCombo = 0;

  for (const row of data || []) {
    const category = row.category as string;
    const qty = (row.quantity as number) || 0;

    if (category === 'combo') {
      combo += qty;
    } else if (category === 'non_combo') {
      nonCombo += qty;
    }
  }

  const total = combo + nonCombo;
  const comboPercent = total > 0 ? Math.round((combo / total) * 100) : 0;

  return { combo, nonCombo, comboPercent };
}

export async function getLocationComboByVenue(reportId: string): Promise<LocationComboData[]> {
  const supabase = getSupabaseServerClient();

  const { data: metricData, error: metricError } = await supabase
    .from('metric_values')
    .select('location_id, category, quantity')
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
  const locationDataMap = new Map<string, { combo: number; nonCombo: number }>();

  for (const row of metricData) {
    const locationId = row.location_id as string;
    if (!locationId) continue;
    
    const category = row.category as string;
    const qty = (row.quantity as number) || 0;

    if (!locationDataMap.has(locationId)) {
      locationDataMap.set(locationId, { combo: 0, nonCombo: 0 });
    }

    const locationData = locationDataMap.get(locationId)!;
    if (category === 'combo') {
      locationData.combo += qty;
    } else if (category === 'non_combo') {
      locationData.nonCombo += qty;
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

export async function getIndividualComboPercent(reportId: string): Promise<IndividualComboData[]> {
  const supabase = getSupabaseServerClient();

  const { data: metricData, error: metricError } = await supabase
    .from('metric_values')
    .select('user_id, category, quantity')
    .eq('report_id', reportId)
    .in('category', ['combo', 'non_combo']);

  if (metricError) {
    throw new Error(`Failed to fetch metric values: ${metricError.message}`);
  }

  if (!metricData || metricData.length === 0) {
    return [];
  }

  // Get unique user IDs
  const userIds = [...new Set(metricData.map((m) => m.user_id as string).filter(Boolean))];

  if (userIds.length === 0) {
    return [];
  }

  // Fetch users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name')
    .in('id', userIds);

  if (usersError) {
    throw new Error(`Failed to fetch users: ${usersError.message}`);
  }

  // Create user map
  const userMap = new Map<string, string>();
  for (const user of users || []) {
    userMap.set(user.id as string, user.name as string);
  }

  // Group by user name
  const userDataMap = new Map<string, { combo: number; nonCombo: number }>();

  for (const row of metricData) {
    const userId = row.user_id as string;
    if (!userId) continue;
    const userName = userMap.get(userId) || 'Unknown';
    const category = row.category as string;
    const qty = (row.quantity as number) || 0;

    if (!userDataMap.has(userName)) {
      userDataMap.set(userName, { combo: 0, nonCombo: 0 });
    }

    const userData = userDataMap.get(userName)!;
    if (category === 'combo') {
      userData.combo += qty;
    } else if (category === 'non_combo') {
      userData.nonCombo += qty;
    }
  }

  return Array.from(userDataMap.entries()).map(([name, data]) => {
    const total = data.combo + data.nonCombo;
    const comboPercent = total > 0 ? Math.round((data.combo / total) * 100) : 0;

    return {
      name,
      comboQty: data.combo,
      nonComboQty: data.nonCombo,
      comboPercent,
    };
  });
}

