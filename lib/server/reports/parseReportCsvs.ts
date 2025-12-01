'use server';

import Papa from 'papaparse';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

interface ProductRule {
  id: string;
  location_id: string;
  product_name: string;
  product_pattern?: string; // Keep for backward compatibility
  category: string;
  arcade_group_label: string | null;
  match_type: string;
}

/**
 * Helper function to determine if a name looks like a staff member's name.
 * Staff names are typically alphabetic and don't contain product-like patterns.
 */
function looksLikeStaffName(name: string): boolean {
  // Must contain at least one letter
  if (!/[A-Za-z]/.test(name)) return false;

  // Ignore obvious product-like patterns: digits or parentheses
  if (/[0-9]/.test(name)) return false;
  if (/[()]/.test(name)) return false;

  // Ignore "Total ..." (already skipped) and other keywords if needed
  // e.g. "Booking Fees", "Manual Discounts" etc could be handled by rules later

  return true;
}

/**
 * Parse all CSVs for a report and create:
 * - Location-level metric rows in metric_values (for product rows)
 * - Staff-level metric rows in staff_metrics (for staff product rows)
 * No user creation - does not touch the users table.
 */
export async function parseReportCsvs(reportId: string) {
  const supabase = getSupabaseServerClient();

  // Load report_uploads for this report
  const { data: uploads, error: uploadsError } = await supabase
    .from('report_uploads')
    .select('*')
    .eq('report_id', reportId);

  if (uploadsError || !uploads) {
    throw new Error(`Failed to load report uploads: ${uploadsError?.message}`);
  }

  if (uploads.length === 0) {
    throw new Error('No CSV uploads found for this report');
  }

  // Process each uploaded CSV
  for (const upload of uploads) {
    const locationId = upload.location_id as string;
    const storagePath = upload.storage_path as string;

    // Download CSV from Supabase Storage
    const { data: csvData, error: downloadError } = await supabase.storage
      .from('report-csvs')
      .download(storagePath);

    if (downloadError || !csvData) {
      console.error(`[parseReportCsvs] Failed to download CSV for ${storagePath}`, downloadError);
      throw new Error(`Failed to download CSV: ${downloadError?.message}`);
    }

    // Convert blob to text
    const csvText = await csvData.text();

    // Parse CSV without headers - we'll find the header row manually
    const parseResult = Papa.parse<string[]>(csvText, {
      header: false,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      console.warn('[parseReportCsvs] CSV parsing warnings:', parseResult.errors);
      // Don't throw - continue processing
    }

    if (!parseResult.data || parseResult.data.length === 0) {
      console.warn(`[parseReportCsvs] No data rows found in CSV for location ${locationId}`);
      continue;
    }

    // Find the header row: first row containing a cell matching /volume\s*in-?store/i
    let headerRowIndex = -1;
    let headerRow: string[] | null = null;

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      const hasVolumeInStore = row.some((cell) => /volume\s*in-?store/i.test(String(cell || '').trim()));
      if (hasVolumeInStore) {
        headerRowIndex = i;
        headerRow = row;
        break;
      }
    }

    if (!headerRow || headerRowIndex === -1) {
      console.error(
        `[parseReportCsvs] Could not find header row with "Volume In-Store" in CSV for location ${locationId}`
      );
      continue; // Skip this file
    }

    // Find column indices from header row
    let nameIndex = -1;
    let volumeIndex = -1;

    for (let i = 0; i < headerRow.length; i++) {
      const cell = String(headerRow[i] || '').trim();
      const lowerCell = cell.toLowerCase();

      // Find nameIndex: cell exactly matches "Name" (case-insensitive)
      if (nameIndex === -1 && lowerCell === 'name') {
        nameIndex = i;
      }

      // Find volumeIndex: cell includes "volume" and "store" but not "online"
      if (
        volumeIndex === -1 &&
        lowerCell.includes('volume') &&
        lowerCell.includes('store') &&
        !lowerCell.includes('online')
      ) {
        volumeIndex = i;
      }
    }

    if (nameIndex === -1) {
      console.error(`[parseReportCsvs] Could not find "Name" column in header for location ${locationId}`);
      continue; // Skip this file
    }

    if (volumeIndex === -1) {
      console.error(
        `[parseReportCsvs] Could not find "Volume In-Store" column in header for location ${locationId}`
      );
      continue; // Skip this file
    }

    // Load product_rules for this location (exact match only)
    const { data: rules, error: rulesError } = await supabase
      .from('product_rules')
      .select('*')
      .eq('location_id', locationId)
      .eq('match_type', 'exact');

    if (rulesError) {
      console.error(`[parseReportCsvs] Failed to load product rules for location ${locationId}:`, rulesError);
      continue; // Skip this file
    }

    if (!rules || rules.length === 0) {
      console.warn(`[parseReportCsvs] No product rules found for location ${locationId}`);
      continue; // Skip this file
    }

    // Build lookup function for product matching (exact, case-insensitive)
    const matchRuleForProduct = (productName: string): ProductRule | null => {
      const target = productName.trim().toLowerCase();
      // Try product_name first, fallback to product_pattern for backward compatibility
      return (
        rules.find(
          (r) =>
            r.match_type === 'exact' &&
            ((r.product_name && r.product_name.trim().toLowerCase() === target) ||
              (r.product_pattern && r.product_pattern.trim().toLowerCase() === target))
        ) ?? null
      );
    };

    // Process rows after the header row
    const metricRows: Array<{
      report_id: string;
      location_id: string;
      user_id: null; // Always null - location-level only
      product_name: string;
      category: string;
      arcade_group_label: string | null;
      value: number;
    }> = [];

    const staffRows: Array<{
      report_id: string;
      location_id: string;
      staff_name: string;
      category: string;
      value: number;
    }> = [];

    // Tracking counters for logging
    let productRowsInserted = 0;
    let staffRowsInserted = 0;
    let rowsSkipped_invalidQuantity = 0;
    let rowsSkipped_missingName = 0;
    const unmatchedProducts = new Set<string>();

    // Staff block tracking
    let currentStaffName: string | null = null;
    let insideStaffBlock = false;

    // Helper function to detect staff header rows
    // A row is a staff header if: row[0] is non-empty AND every other cell is empty
    const isStaffHeaderRow = (row: string[]): boolean => {
      if (row.length === 0) return false;
      const firstCell = (row[0] || '').trim();
      if (!firstCell) return false;
      
      // Check if all other cells are empty
      for (let i = 1; i < row.length; i++) {
        const cell = (row[i] || '').trim();
        if (cell) return false;
      }
      return true;
    };

    // Helper function to check if a row is a product header row
    const isProductHeaderRow = (row: string[]): boolean => {
      return row.some((cell) => /volume\s*in-?store/i.test(String(cell || '').trim()));
    };

    // Iterate rows after the initial header row
    for (let i = headerRowIndex + 1; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];

      // ========================================================================
      // STEP 1: Detect staff header rows
      // ========================================================================
      if (isStaffHeaderRow(row)) {
        // This is a staff header row
        currentStaffName = (row[0] || '').trim();
        insideStaffBlock = true;
        continue; // Do not treat as a sale
      }

      // ========================================================================
      // STEP 2: Detect product header row inside staff block
      // ========================================================================
      if (insideStaffBlock && isProductHeaderRow(row)) {
        // Update column indexes from this header row
        nameIndex = -1;
        volumeIndex = -1;

        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || '').trim();
          const lowerCell = cell.toLowerCase();

          // Find nameIndex: cell exactly matches "Name" (case-insensitive)
          if (nameIndex === -1 && lowerCell === 'name') {
            nameIndex = j;
          }

          // Find volumeIndex: cell includes "volume" and "store" but not "online"
          if (
            volumeIndex === -1 &&
            lowerCell.includes('volume') &&
            lowerCell.includes('store') &&
            !lowerCell.includes('online')
          ) {
            volumeIndex = j;
          }
        }

        // If we couldn't find the columns, exit staff block
        if (nameIndex === -1 || volumeIndex === -1) {
          insideStaffBlock = false;
          currentStaffName = null;
        }

        continue; // Do not insert anything for header row
      }

      // ========================================================================
      // STEP 3: End staff block conditions
      // ========================================================================
      // If we hit self-serve or empty rows outside a staff block, end it
      const firstCell = (row[0] || '').trim();
      if (!insideStaffBlock) {
        // Already outside staff block, check if we should start a new one
        // (handled above in STEP 1)
      } else {
        // Inside staff block - check for end conditions
        if (!firstCell || /^self-serve$/i.test(firstCell)) {
          insideStaffBlock = false;
          currentStaffName = null;
        }
      }

      // ========================================================================
      // STEP 4: Extract and validate name and quantity
      // ========================================================================
      const name = (row[nameIndex] || '').trim();
      const volumeRaw = (row[volumeIndex] || '').trim();
      const hasNumericValue = volumeRaw && !Number.isNaN(Number(String(volumeRaw).replace(/[^0-9.-]/g, '')));

      // If name is present but volume is empty/zero, skip this row
      if (!hasNumericValue) {
        continue;
      }

      // Parse quantity from volumeIndex, stripping non-numeric characters
      const quantity = Number(String(volumeRaw).replace(/[^0-9.-]/g, ''));

      // Skip if quantity <= 0 or NaN
      if (Number.isNaN(quantity) || quantity <= 0) {
        rowsSkipped_invalidQuantity++;
        continue;
      }

      // ========================================================================
      // STEP 5: Skip rows early (totals / junk)
      // ========================================================================
      
      // a) Empty name
      if (!name) {
        rowsSkipped_missingName++;
        continue;
      }

      // b) Self-serve rows (online)
      if (/^self-serve$/i.test(name)) {
        if (insideStaffBlock) {
          insideStaffBlock = false;
          currentStaffName = null;
        }
        continue;
      }

      // c) Totals / summary lines (like "Total Sales - Arcade", "Grand Total")
      if (/^(total|grand total)/i.test(name)) {
        continue;
      }

      // ========================================================================
      // STEP 6: Try to match a product rule
      // ========================================================================
      const productRule = matchRuleForProduct(name);

      if (productRule) {
        // PRODUCT ROW → Insert into metric_values (always)
        const productName = name;
        metricRows.push({
          report_id: reportId,
          location_id: locationId,
          user_id: null, // Always null - location-level only
          product_name: productName,
          category: productRule.category, // 'combo' | 'non_combo' | 'other'
          arcade_group_label: productRule.arcade_group_label ?? null,
          value: quantity,
        });
        productRowsInserted++;

        // ====================================================================
        // STEP 7: If inside staff block, also insert into staff_metrics
        // ====================================================================
        if (insideStaffBlock && currentStaffName) {
          // Determine category for staff_metrics
          // If arcade_group_label IS NOT NULL → category = 'arcade'
          // Otherwise use rule.category (combo or non_combo)
          let staffCategory: string | null = null;
          if (productRule.arcade_group_label !== null && productRule.arcade_group_label !== undefined) {
            staffCategory = 'arcade';
          } else {
            // Use rule.category, but only allow 'combo' or 'non_combo' for staff_metrics
            if (productRule.category === 'combo' || productRule.category === 'non_combo') {
              staffCategory = productRule.category;
            }
            // Skip 'other' category for staff_metrics (but metric_values already inserted)
          }

          // Only insert if we determined a valid category
          if (staffCategory) {
            staffRows.push({
              report_id: reportId,
              location_id: locationId,
              staff_name: currentStaffName,
              category: staffCategory,
              value: quantity,
            });
            staffRowsInserted++;
          }
        }

        continue;
      }

      // ========================================================================
      // STEP 8: If no product rule, treat as unmatched product
      // ========================================================================
      if (!productRule) {
        unmatchedProducts.add(name);
        continue;
      }
    }

    // Insert metric rows (products) if any were created
    if (metricRows.length > 0) {
      const { error: insertError } = await supabase.from('metric_values').insert(metricRows);

      if (insertError) {
        console.error(`[parseReportCsvs] Failed to insert metric values for location ${locationId}:`, insertError);
        throw new Error(`Failed to insert metric values: ${insertError.message}`);
      }
    }

    // Insert staff rows if any were created
    if (staffRows.length > 0) {
      const { error: insertError } = await supabase.from('staff_metrics').insert(staffRows);

      if (insertError) {
        console.error(`[parseReportCsvs] Failed to insert staff metrics for location ${locationId}:`, insertError);
        throw new Error(`Failed to insert staff metrics: ${insertError.message}`);
      }
    }

    // Log summary
    console.info('[parseReportCsvs] summary', {
      locationId,
      reportId,
      productRowsInserted,
      staffRowsInserted,
      rowsSkipped_invalidQuantity,
      rowsSkipped_missingName,
      unmatchedProducts: Array.from(unmatchedProducts).sort(),
    });

    if (metricRows.length === 0) {
      console.warn(
        `[parseReportCsvs] No valid metric rows created for location ${locationId}. ` +
        `Unmatched products: ${Array.from(unmatchedProducts).join(', ')}`
      );
      // Don't throw - report page should still load with "No data available"
    }
  }

  return { success: true, message: 'CSVs parsed successfully' };
}
