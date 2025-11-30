'use server';

import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function ensureBaseLocations() {
  const supabase = getSupabaseServerClient();

  const baseLocations = [
    { name: 'Auckland', code: 'AKL' },
    { name: 'Christchurch', code: 'CHC' },
    { name: 'Queenstown', code: 'QT' },
  ];

  const { error } = await supabase
    .from('locations')
    .upsert(baseLocations, { onConflict: 'code' });

  if (error) {
    console.error('Failed to ensure base locations', error);
    throw error;
  }

  const { data, error: selectError } = await supabase
    .from('locations')
    .select('*')
    .in('code', baseLocations.map(l => l.code));

  if (selectError) {
    console.error('Failed to fetch base locations', selectError);
    throw selectError;
  }

  return data;
}

