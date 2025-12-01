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

