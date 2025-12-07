# Processes Folder — Overview & How to Use

## What This Folder Contains

This folder contains documentation for the GO Reports application's core business processes and data architecture.

- **`architecture.md`** — High-level overview of the entire system: CSV upload → parsing → product_rules classification → metrics/staff_metrics creation → weekly & monthly report generation. Includes data flow diagrams and table descriptions.

- **Process files** — One file per business process:
  - `report-creation.md` — Weekly and monthly report creation workflow
  - `csv-upload.md` — CSV file upload and storage path structure
  - `csv-parsing.md` — Complete parseReportCsvs flow with product matching and staff detection
  - `product-categorisation.md` — How combo/non_combo/arcade/other categorization works
  - `product-rules.md` — How product rules are matched and used during parsing
  - `staff-filtering.md` — How staff filtering works for Individual Arcade and Individual Sales reports
  - `report-ui-reading.md` — How Weekly and Monthly Reports UI pages read from the database

- **Data model docs** — Brief descriptions of key tables:
  - `reports` — Report metadata (type, period_start, period_end, label)
  - `report_uploads` — Links uploaded CSV files to reports and locations
  - `metric_values` — Location-level product metrics (combo, non_combo, arcade, other)
  - `staff_metrics` — Staff-level product metrics (combo, non_combo, arcade only)
  - `product_rules` — Rules for categorizing products by name and location
  - `staff_report_filters` — Per-staff visibility preferences for individual reports

## How to Use This Folder (For Devs / AI Tools)

### Before Making a Change
Read `architecture.md` to understand the overall system flow, then read the relevant process file(s) for the specific functionality you're modifying. This ensures you understand the current behavior and dependencies.

### When Adding New Functionality
1. Update or create a process file documenting the new functionality
2. Update `architecture.md` if the system-level data flow changes
3. Update data model descriptions if new tables or columns are added

### When Updating Existing Logic
1. Update the relevant process file to reflect the new behavior
2. Update any pseudocode or examples so they match current implementation
3. Document any edge cases or special logic that was added

### When CSV Formats or Product Rules Change
1. Update `product-rules.md` or `csv-parsing.md` to explain the changes
2. Document the impact on the four main reports (Arcade Sales, Individual Arcade, Combo Sales, Individual Sales)
3. Note any changes to categorization logic or staff metrics filtering

## AI Usage Guidance

When using Cursor, ChatGPT, or other AI coding assistants:

- **Always reference these process docs** — Point AI tools to specific files when asking questions or requesting changes
- **Ask AI to follow documented rules** — Explicitly reference:
  - Combo vs non_combo vs arcade vs other categorization logic
  - Staff filtering behavior for Individual Arcade and Individual Sales reports
  - Weekly vs monthly report differences (only in type field and label format)
  - Product rule matching (exact, case-insensitive)
  - Staff metrics filtering (only specific arcade types included)

## Why This Folder Matters

This documentation prevents accidental changes to critical business logic. The system has specific rules for:

- **Combo vs non-combo logic** — Determines which products appear in Combo Sales and Individual Sales reports, and how combo percentages are calculated
- **staff_metrics vs metric_values behavior** — Location-level data goes to metric_values, staff-level data goes to both tables with special filtering
- **Which products appear in each report** — Arcade Sales uses metric_values (arcade category), Individual Arcade uses staff_metrics (arcade category, filtered), Combo Sales uses metric_values (combo/non_combo), Individual Sales uses staff_metrics (combo/non_combo, filtered)
- **Weekly vs monthly report behavior** — Same parsing logic, only differs in type field and label format

Without this documentation, changes could break report calculations, mis-categorize products, or exclude valid data from reports.

