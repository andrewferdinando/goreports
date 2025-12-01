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
    // Use skipEmptyLines: false so we can detect empty rows that end staff blocks
    const parseResult = Papa.parse<string[]>(csvText, {
      header: false,
      skipEmptyLines: false,
    });

    if (parseResult.errors.length > 0) {
      console.warn('[parseReportCsvs] CSV parsing warnings:', parseResult.errors);
      // Don't throw - continue processing
    }

    if (!parseResult.data || parseResult.data.length === 0) {
      console.warn(`[parseReportCsvs] No data rows found in CSV for location ${locationId}`);
      continue;
    }

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

    // Helper function to check if a row is empty
    const isEmptyRow = (row: string[]): boolean => {
      return row.every((cell) => !(cell || '').trim());
    };

    // Helper function to extract column indices from a header row
    const extractColumnIndices = (headerRow: string[]): { nameIndex: number; volumeIndex: number } | null => {
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

      if (nameIndex === -1 || volumeIndex === -1) {
        return null;
      }

      return { nameIndex, volumeIndex };
    };

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

    // Process rows - collect all data
    const metricRows: Array<{
      report_id: string;
      location_id: string;
      user_id: null; // Always null - location-level only
      product_name: string;
      category: string;
      arcade_group_label: string | null;
      value: number;
      user_name: string | null; // Staff name if inside staff block, null for location-level
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

    // Find all staff header rows in the entire CSV
    const staffHeaderIndices: Array<{ index: number; staffName: string }> = [];
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      if (isStaffHeaderRow(row)) {
        const staffName = (row[0] || '').trim();
        if (staffName) {
          staffHeaderIndices.push({ index: i, staffName });
        }
      }
    }

    // Find the first product header row (for location-level products)
    let firstHeaderRowIndex = -1;
    let firstHeaderRow: string[] | null = null;
    let firstHeaderIndices: { nameIndex: number; volumeIndex: number } | null = null;

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      if (isProductHeaderRow(row)) {
        firstHeaderRowIndex = i;
        firstHeaderRow = row;
        firstHeaderIndices = extractColumnIndices(row);
        break;
      }
    }

    if (!firstHeaderRow || !firstHeaderIndices) {
      console.error(
        `[parseReportCsvs] Could not find product header row with "Volume In-Store" in CSV for location ${locationId}`
      );
      continue; // Skip this file
    }

    // Process location-level products (rows after first header, before first staff block or end)
    const firstStaffIndex = staffHeaderIndices.length > 0 ? staffHeaderIndices[0].index : parseResult.data.length;
    for (let i = firstHeaderRowIndex + 1; i < firstStaffIndex; i++) {
      const row = parseResult.data[i];
      if (isEmptyRow(row)) continue;

      const name = (row[firstHeaderIndices.nameIndex] || '').trim();
      const volumeRaw = (row[firstHeaderIndices.volumeIndex] || '').trim();
      const hasNumericValue = volumeRaw && !Number.isNaN(Number(String(volumeRaw).replace(/[^0-9.-]/g, '')));

      if (!hasNumericValue) continue;

      const quantity = Number(String(volumeRaw).replace(/[^0-9.-]/g, ''));
      if (Number.isNaN(quantity) || quantity <= 0) {
        rowsSkipped_invalidQuantity++;
        continue;
      }

      if (!name) {
        rowsSkipped_missingName++;
        continue;
      }

      // Skip self-serve and totals
      if (/^self-serve$/i.test(name) || /^(total|grand total)/i.test(name)) {
        continue;
      }

      const productRule = matchRuleForProduct(name);
      if (productRule) {
        metricRows.push({
          report_id: reportId,
          location_id: locationId,
          user_id: null,
          product_name: name,
          category: productRule.category,
          arcade_group_label: productRule.arcade_group_label ?? null,
          value: quantity,
          user_name: null, // Location-level product, no staff name
        });
        productRowsInserted++;
      } else {
        unmatchedProducts.add(name);
      }
    }

    // Process each staff block
    for (let staffIdx = 0; staffIdx < staffHeaderIndices.length; staffIdx++) {
      const staffHeader = staffHeaderIndices[staffIdx];
      const staffName = staffHeader.staffName;
      const staffStartIndex = staffHeader.index;

      // Find the next product header row after this staff header
      let productHeaderIndex = -1;
      let productHeaderIndices: { nameIndex: number; volumeIndex: number } | null = null;

      for (let i = staffStartIndex + 1; i < parseResult.data.length; i++) {
        const row = parseResult.data[i];
        if (isProductHeaderRow(row)) {
          productHeaderIndex = i;
          productHeaderIndices = extractColumnIndices(row);
          break;
        }
      }

      if (!productHeaderIndices) {
        console.warn(`[parseReportCsvs] Could not find product header after staff header "${staffName}" at row ${staffStartIndex}`);
        continue; // Skip this staff block
      }

      // Find the end of this staff block:
      // - Next staff header row, OR
      // - Empty row, OR
      // - End of file
      const nextStaffIndex = (staffIdx + 1) < staffHeaderIndices.length 
        ? staffHeaderIndices[staffIdx + 1].index 
        : parseResult.data.length;

      let staffBlockEndIndex = nextStaffIndex;
      for (let i = productHeaderIndex + 1; i < nextStaffIndex; i++) {
        const row = parseResult.data[i];
        if (isEmptyRow(row)) {
          staffBlockEndIndex = i;
          break;
        }
      }

      // Process rows in this staff block
      for (let i = productHeaderIndex + 1; i < staffBlockEndIndex; i++) {
        const row = parseResult.data[i];
        if (isEmptyRow(row)) continue;

        const name = (row[productHeaderIndices.nameIndex] || '').trim();
        const volumeRaw = (row[productHeaderIndices.volumeIndex] || '').trim();
        const hasNumericValue = volumeRaw && !Number.isNaN(Number(String(volumeRaw).replace(/[^0-9.-]/g, '')));

        if (!hasNumericValue) continue;

        const quantity = Number(String(volumeRaw).replace(/[^0-9.-]/g, ''));
        if (Number.isNaN(quantity) || quantity <= 0) {
          rowsSkipped_invalidQuantity++;
          continue;
        }

        if (!name) {
          rowsSkipped_missingName++;
          continue;
        }

        // Skip self-serve and totals
        if (/^self-serve$/i.test(name) || /^(total|grand total)/i.test(name)) {
          continue;
        }

        const productRule = matchRuleForProduct(name);
        if (productRule) {
          // Always insert into metric_values
          metricRows.push({
            report_id: reportId,
            location_id: locationId,
            user_id: null,
            product_name: name,
            category: productRule.category,
            arcade_group_label: productRule.arcade_group_label ?? null,
            value: quantity,
            user_name: staffName ?? null, // Use same staffName as staff_metrics.staff_name
          });
          productRowsInserted++;

          // Determine category for staff_metrics
          let staffCategory: 'arcade' | 'combo' | 'non_combo' | null = null;

          if (productRule.category === 'arcade') {
            // Only count "Spend X Get X" arcade offers
            const label = productRule.arcade_group_label ?? '';
            const isSpendArcade = label.startsWith('Spend');
            const isTenOrTwenty = label === '$10 Card' || label === '$20 Card';

            if (isSpendArcade && !isTenOrTwenty) {
              staffCategory = 'arcade';
            } else {
              // skip $10 / $20 and any other arcade that is not Spend X
              staffCategory = null;
            }
          } else if (
            productRule.category === 'combo' ||
            productRule.category === 'non_combo'
          ) {
            staffCategory = productRule.category;
          }

          // When pushing staff rows:
          if (staffCategory) {
            // TEMPORARY DEBUG LOG
            console.log('[staff_metrics insert]', {
              staffName,
              locationId,
              category: staffCategory,
              productName: name,
              units: quantity,
            });

            staffRows.push({
              report_id: reportId,
              location_id: locationId,
              staff_name: staffName,
              category: staffCategory,
              value: quantity,
            });
            staffRowsInserted++;
          }
        } else {
          unmatchedProducts.add(name);
        }
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
