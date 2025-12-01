# Staff Report Filters Setup

## Database Migration Required

The `staff_report_filters` table needs to be created in your Supabase database before the Users settings page will work.

### Steps to Create the Table

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Run the following SQL script:

```sql
-- Create staff_report_filters table
CREATE TABLE IF NOT EXISTS staff_report_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name TEXT UNIQUE NOT NULL,
  include_in_individual_reports BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on staff_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_report_filters_staff_name ON staff_report_filters(staff_name);

-- Seed with existing staff names from staff_metrics
INSERT INTO staff_report_filters (staff_name)
SELECT DISTINCT staff_name
FROM staff_metrics
WHERE staff_name IS NOT NULL
ON CONFLICT (staff_name) DO NOTHING;

-- Also seed from metric_values.user_name if it exists
INSERT INTO staff_report_filters (staff_name)
SELECT DISTINCT user_name
FROM metric_values
WHERE user_name IS NOT NULL
  AND user_name NOT IN (SELECT staff_name FROM staff_report_filters)
ON CONFLICT (staff_name) DO NOTHING;
```

4. After running the migration, refresh the Users settings page

### What This Does

- Creates the `staff_report_filters` table to store user visibility preferences
- Seeds it with all existing staff names from your data
- Sets all users to be included by default (`include_in_individual_reports = true`)

### File Location

The migration SQL is also available at: `supabase/migrations/001_create_staff_report_filters.sql`

