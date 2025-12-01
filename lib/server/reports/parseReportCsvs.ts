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
 * Parse all CSVs for a report and create:
 * - Location-level metric rows in metric_values (for product rows)
 * - Staff-level metric rows in staff_metrics (for staff rows)
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
    let productIndex = -1; // Look for "Product" column for staff rows

    for (let i = 0; i < headerRow.length; i++) {
      const cell = String(headerRow[i] || '').trim();
      const lowerCell = cell.toLowerCase();

      // Find nameIndex: cell exactly matches "Name" (case-insensitive)
      if (nameIndex === -1 && lowerCell === 'name') {
        nameIndex = i;
      }

      // Find productIndex: cell matches "Product" (case-insensitive)
      if (productIndex === -1 && lowerCell === 'product') {
        productIndex = i;
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
    let staffRowsSkipped_noRuleMatch = 0;
    let rowsSkipped_invalidQuantity = 0;
    let rowsSkipped_missingName = 0;
    const unmatchedProducts = new Set<string>();
    const unmatchedStaff = new Set<string>();

    // Iterate rows after the header row
    for (let i = headerRowIndex + 1; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];

      // Extract name from nameIndex
      const name = (row[nameIndex] || '').trim();

      // Skip rows where name is empty
      if (!name) {
        rowsSkipped_missingName++;
        continue;
      }

      const lowerName = name.toLowerCase();

      // Skip rows where name is "Self-serve" or starts with "Total " or "Grand Total"
      if (
        lowerName === 'self-serve' ||
        lowerName.startsWith('total ') ||
        lowerName === 'grand total' ||
        lowerName.startsWith('grand total')
      ) {
        continue;
      }

      // Check if this looks like a "staff label" row: name present but no numeric values in other cells
      // A staff label row would have name but empty/zero values in numeric columns
      const volumeRaw = (row[volumeIndex] || '').trim();
      const hasNumericValue = volumeRaw && !Number.isNaN(Number(String(volumeRaw).replace(/[^0-9.-]/g, '')));

      // If name is present but volume is empty/zero, this is likely a staff label row - skip it
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
      // DISTINGUISH STAFF ROWS VS PRODUCT ROWS
      // ========================================================================
      // A row is a PRODUCT if: name matches a product_rule
      // A row is a STAFF if: name does NOT match a product_rule AND has valid quantity
      const productRule = matchRuleForProduct(name);

      if (productRule) {
        // ====================================================================
        // PRODUCT ROW → Insert into metric_values
        // ====================================================================
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
      } else {
        // ====================================================================
        // STAFF ROW → Insert into staff_metrics
        // ====================================================================
        // For staff rows, we need to determine the category from the product they sold
        // Look for product name in "Product" column
        // If Product column doesn't exist or is empty, we can't determine category → skip
        const productName = productIndex >= 0 ? (row[productIndex] || '').trim() : '';
        
        if (!productName) {
          // No product name found → can't determine category → skip this staff row
          staffRowsSkipped_noRuleMatch++;
          unmatchedStaff.add(`${name} (no product column)`);
          continue;
        }
        
        // Match the product against product_rules to get category
        const staffProductRule = matchRuleForProduct(productName);

        if (!staffProductRule) {
          // No matching rule for the product → skip this staff row
          staffRowsSkipped_noRuleMatch++;
          unmatchedStaff.add(`${name} (product: ${productName})`);
          continue;
        }

        // Determine category based on the matched rule
        // combo → category = 'combo'
        // non_combo → category = 'non_combo'
        // arcade (arcade_group_label IS NOT NULL) → category = 'arcade'
        let staffCategory: 'combo' | 'non_combo' | 'arcade';
        
        if (staffProductRule.arcade_group_label !== null && staffProductRule.arcade_group_label !== undefined) {
          // Has arcade_group_label → category = 'arcade'
          staffCategory = 'arcade';
        } else if (staffProductRule.category === 'combo') {
          staffCategory = 'combo';
        } else if (staffProductRule.category === 'non_combo') {
          staffCategory = 'non_combo';
        } else {
          // For 'other' category, we need to check if it should be arcade
          // If it has arcade_group_label, it's arcade, otherwise skip
          staffRowsSkipped_noRuleMatch++;
          unmatchedStaff.add(`${name} (product: ${productName}, category: ${staffProductRule.category})`);
          continue;
        }

        // Insert staff row into staff_metrics
        staffRows.push({
          report_id: reportId,
          location_id: locationId,
          staff_name: name, // Staff member's name from Name column
          category: staffCategory,
          value: quantity, // Volume In-Store
        });
        staffRowsInserted++;
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
      staffRowsSkipped_noRuleMatch,
      rowsSkipped_invalidQuantity,
      rowsSkipped_missingName,
      unmatchedProducts: Array.from(unmatchedProducts).sort(),
      unmatchedStaff: Array.from(unmatchedStaff).sort(),
    });

    if (metricRows.length === 0 && staffRows.length === 0) {
      console.warn(
        `[parseReportCsvs] No valid rows created for location ${locationId}. ` +
        `Unmatched products: ${Array.from(unmatchedProducts).join(', ')}. ` +
        `Unmatched staff: ${Array.from(unmatchedStaff).join(', ')}`
      );
      // Don't throw - report page should still load with "No data available"
    }
  }

  return { success: true, message: 'CSVs parsed successfully' };
}
