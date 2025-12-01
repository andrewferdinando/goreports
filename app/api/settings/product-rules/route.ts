import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;
    const locationName = searchParams.get('location_name');
    const search = searchParams.get('search');

    // First, get location IDs if filtering by location name
    let locationIds: string[] | null = null;
    if (locationName && locationName !== 'All venues') {
      const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id')
        .eq('name', locationName);

      if (locError) {
        console.error('Error fetching locations:', locError);
        return NextResponse.json(
          { data: null, error: 'Failed to fetch locations' },
          { status: 500 }
        );
      }

      locationIds = locations?.map(l => l.id as string) || [];
      if (locationIds.length === 0) {
        return NextResponse.json({ data: [], error: null });
      }
    }

    // Build query with join to locations table
    let query = supabase
      .from('product_rules')
      .select(`
        *,
        locations (
          id,
          name
        )
      `)
      .eq('is_active', true);

    if (locationIds) {
      query = query.in('location_id', locationIds);
    }

    if (search) {
      query = query.ilike('product_pattern', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching product rules:', error);
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 }
      );
    }

    // Transform data to include location_name for display
    const transformedData = (data || []).map((rule: any) => ({
      ...rule,
      location_name: rule.locations?.name || 'Unknown',
    }));

    // Sort by location name, then product pattern
    transformedData.sort((a: any, b: any) => {
      const locCompare = (a.location_name || '').localeCompare(b.location_name || '');
      if (locCompare !== 0) return locCompare;
      return (a.product_pattern || '').localeCompare(b.product_pattern || '');
    });

    return NextResponse.json({ data: transformedData, error: null });
  } catch (error) {
    console.error('Error in GET product-rules:', error);
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : 'Failed to fetch product rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();

    const { location_name, product_pattern, category, arcade_group_label } = body;

    // Validate required fields
    if (!location_name || !product_pattern || !category) {
      return NextResponse.json(
        { data: null, error: 'location_name, product_pattern, and category are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['combo', 'non_combo', 'arcade', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { data: null, error: 'category must be one of: combo, non_combo, arcade, other' },
        { status: 400 }
      );
    }

    // Get location_id from location_name
    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('id')
      .eq('name', location_name)
      .single();

    if (locError || !location) {
      return NextResponse.json(
        { data: null, error: `Location "${location_name}" not found` },
        { status: 400 }
      );
    }

    const locationId = location.id as string;
    const trimmedPattern = product_pattern.trim();

    // Check for duplicates (case-insensitive product_pattern match)
    const { data: existingRules, error: checkError } = await supabase
      .from('product_rules')
      .select('id, product_pattern')
      .eq('location_id', locationId);

    if (checkError) {
      console.error('Error checking for duplicates:', checkError);
      return NextResponse.json(
        { data: null, error: 'Failed to check for existing rules' },
        { status: 500 }
      );
    }

    // Check for case-insensitive match in JavaScript
    if (existingRules && existingRules.some(rule => 
      rule.product_pattern?.trim().toLowerCase() === trimmedPattern.toLowerCase()
    )) {
      return NextResponse.json(
        { data: null, error: 'A rule with this location and product name already exists' },
        { status: 400 }
      );
    }

    // Insert new rule
    const { data: newRule, error: insertError } = await supabase
      .from('product_rules')
      .insert({
        location_id: locationId,
        product_pattern: trimmedPattern,
        category,
        match_type: 'exact',
        is_active: true,
        arcade_group_label: arcade_group_label || null,
      })
      .select(`
        *,
        locations (
          id,
          name
        )
      `)
      .single();

    if (insertError) {
      console.error('Error inserting product rule:', insertError);
      return NextResponse.json(
        { data: null, error: insertError.message },
        { status: 500 }
      );
    }

    // Transform to include location_name
    const transformedRule = {
      ...newRule,
      location_name: newRule.locations?.name || location_name,
    };

    return NextResponse.json({ data: transformedRule, error: null });
  } catch (error) {
    console.error('Error in POST product-rules:', error);
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : 'Failed to create product rule' },
      { status: 500 }
    );
  }
}

