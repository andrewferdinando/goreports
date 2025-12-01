import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;
    const locationName = searchParams.get('location_name');
    const search = searchParams.get('search');

    let query = supabase
      .from('product_rules')
      .select('*')
      .eq('is_active', true);

    if (locationName && locationName !== 'All venues') {
      query = query.eq('location_name', locationName);
    }

    if (search) {
      query = query.ilike('product_pattern', `%${search}%`);
    }

    query = query.order('location_name', { ascending: true })
      .order('product_pattern', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching product rules:', error);
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [], error: null });
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

    // Check for duplicates (case-insensitive product_pattern match)
    const { data: existingRules, error: checkError } = await supabase
      .from('product_rules')
      .select('id')
      .eq('location_name', location_name)
      .ilike('product_pattern', product_pattern);

    if (checkError) {
      console.error('Error checking for duplicates:', checkError);
      return NextResponse.json(
        { data: null, error: 'Failed to check for existing rules' },
        { status: 500 }
      );
    }

    if (existingRules && existingRules.length > 0) {
      return NextResponse.json(
        { data: null, error: 'A rule with this location and product name already exists' },
        { status: 400 }
      );
    }

    // Insert new rule
    const { data: newRule, error: insertError } = await supabase
      .from('product_rules')
      .insert({
        location_name,
        product_pattern,
        category,
        match_type: 'exact',
        is_active: true,
        arcade_group_label: arcade_group_label || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting product rule:', insertError);
      return NextResponse.json(
        { data: null, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newRule, error: null });
  } catch (error) {
    console.error('Error in POST product-rules:', error);
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : 'Failed to create product rule' },
      { status: 500 }
    );
  }
}

