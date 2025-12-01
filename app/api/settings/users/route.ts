import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // Get distinct staff names from staff_metrics
    const { data: staffRows, error: staffError } = await supabase
      .from('staff_metrics')
      .select('staff_name')
      .not('staff_name', 'is', null);

    if (staffError) {
      console.error('Error fetching staff names:', staffError);
      return NextResponse.json(
        { data: null, error: staffError.message },
        { status: 500 }
      );
    }

    // Deduplicate staff names
    const staffNames = [...new Set((staffRows || []).map(row => row.staff_name as string).filter(Boolean))];

    if (staffNames.length === 0) {
      return NextResponse.json({ data: [], error: null });
    }

    // Fetch staff_report_filters for these names
    // Handle case where table doesn't exist yet (return empty array, all users included by default)
    const { data: filters, error: filtersError } = await supabase
      .from('staff_report_filters')
      .select('staff_name, include_in_individual_reports')
      .in('staff_name', staffNames);

    if (filtersError) {
      // If table doesn't exist, treat as if no filters exist (all users included)
      if (filtersError.message.includes('does not exist') || filtersError.message.includes('schema cache')) {
        console.warn('staff_report_filters table does not exist yet. Please run the migration SQL.');
        // Continue with empty filters array - all users will be included by default
      } else {
        console.error('Error fetching staff filters:', filtersError);
        return NextResponse.json(
          { data: null, error: filtersError.message },
          { status: 500 }
        );
      }
    }

    // Create a map of staff_name -> include_in_individual_reports
    const filterMap = new Map<string, boolean>();
    (filters || []).forEach(filter => {
      filterMap.set(filter.staff_name as string, filter.include_in_individual_reports as boolean);
    });

    // Merge: default to true if no filter row exists
    const result = staffNames.map(staffName => ({
      staff_name: staffName,
      include_in_individual_reports: filterMap.get(staffName) ?? true,
    }));

    // Sort by staff name
    result.sort((a, b) => a.staff_name.localeCompare(b.staff_name));

    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    console.error('Error in GET users:', error);
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();

    const { staff_name, include_in_individual_reports } = body;

    // Validate required fields
    if (!staff_name || typeof include_in_individual_reports !== 'boolean') {
      return NextResponse.json(
        { data: null, error: 'staff_name and include_in_individual_reports (boolean) are required' },
        { status: 400 }
      );
    }

    // Upsert into staff_report_filters
    const { data: updatedFilter, error: upsertError } = await supabase
      .from('staff_report_filters')
      .upsert({
        staff_name,
        include_in_individual_reports,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'staff_name',
      })
      .select()
      .single();

    if (upsertError) {
      // If table doesn't exist, provide helpful error message
      if (upsertError.message.includes('does not exist') || upsertError.message.includes('schema cache')) {
        return NextResponse.json(
          { data: null, error: 'The staff_report_filters table does not exist. Please run the migration SQL in Supabase to create it.' },
          { status: 500 }
        );
      }
      console.error('Error upserting staff filter:', upsertError);
      return NextResponse.json(
        { data: null, error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { success: true, filter: updatedFilter }, error: null });
  } catch (error) {
    console.error('Error in PATCH users:', error);
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : 'Failed to update user filter' },
      { status: 500 }
    );
  }
}

