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

interface CsvRow {
  [key: string]: string;
}

/**
 * Parse all CSVs for a report and create location-level metric rows.
 * Location-level only: user_id is always null.
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

    // Parse CSV using papaparse with headers
    const parseResult = Papa.parse<CsvRow>(csvText, {
      header: true,
      skipEmptyLines: false, // We'll handle blank rows ourselves
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      console.warn('[parseReportCsvs] CSV parsing warnings:', parseResult.errors);
      // Don't throw - continue processing
    }

    if (!parseResult.data || parseResult.data.length === 0) {
      console.warn(`[parseReportCsvs] No data rows found in CSV for location ${locationId}`);
      continue;
    }

    // Find the quantity column dynamically
    // First header whose lowercased name includes "volume" and "store" but not "online"
    const firstRow = parseResult.data[0];
    const quantityKey = Object.keys(firstRow).find((key) => {
      const k = key.toLowerCase();
      return k.includes('volume') && k.includes('store') && !k.includes('online');
    });

    if (!quantityKey) {
      console.error(
        `[parseReportCsvs] Could not find "Volume In-Store" column in CSV for location ${locationId}. ` +
        `Available columns: ${Object.keys(firstRow).join(', ')}`
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

    // Build lookup function for product matching
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

    // Process all rows after the first header
    const metricRows: Array<{
      report_id: string;
      location_id: string;
      user_id: null; // Always null for location-level rows
      product_name: string;
      category: string;
      arcade_group_label: string | null;
      value: number;
    }> = [];

    const unmatchedProducts = new Set<string>();

    // Numeric fields to check for staff name rows
    const otherNumericFields = ['Volume Online', 'Sales In-Store', 'Sales Online', 'Discounts', 'Subtotal', 'Tax', 'Total'];

    for (const row of parseResult.data) {
      // Extract product name from 'Name' column
      const rawName = (row['Name'] ?? '').trim();

      // Skip blank name rows
      if (!rawName) {
        continue;
      }

      const lowerName = rawName.toLowerCase();

      // Skip totals / section headers
      if (
        lowerName === 'self-serve' ||
        lowerName.startsWith('total ') ||
        lowerName === 'grand total' ||
        lowerName.startsWith('grand total')
      ) {
        continue;
      }

      // Extract quantity from Volume In-Store column
      const quantityRaw = row[quantityKey];
      const quantity =
        quantityRaw === null || quantityRaw === undefined
          ? NaN
          : Number(String(quantityRaw).replace(/[^0-9.-]/g, ''));

      // Check if this is a staff name row: name present but all numeric cells empty
      const allNumericEmpty = otherNumericFields.every((k) => {
        const val = row[k];
        return val === null || val === undefined || String(val).trim() === '';
      });

      if (allNumericEmpty && (quantityRaw === '' || quantityRaw === undefined || quantityRaw === null)) {
        // This is a staff section header like "Milan Hay" – ignore it
        continue;
      }

      // Skip rows with invalid quantity
      if (Number.isNaN(quantity) || quantity <= 0) {
        continue;
      }

      // At this stage we have a valid product row
      const productName = rawName;
      const rule = matchRuleForProduct(productName);

      if (!rule) {
        unmatchedProducts.add(productName);
        continue;
      }

      // Create location-level metric row
      metricRows.push({
        report_id: reportId,
        location_id: locationId,
        user_id: null, // Location-level only
        product_name: productName,
        category: rule.category, // 'combo' | 'non_combo' | 'other'
        arcade_group_label: rule.arcade_group_label ?? null,
        value: quantity,
      });
    }

    // Insert metric rows if any were created
    if (metricRows.length > 0) {
      const { error: insertError } = await supabase.from('metric_values').insert(metricRows);

      if (insertError) {
        console.error(`[parseReportCsvs] Failed to insert metric values for location ${locationId}:`, insertError);
        throw new Error(`Failed to insert metric values: ${insertError.message}`);
      }
    }

    // Log summary
    console.info('[parseReportCsvs] summary', {
      locationId,
      reportId,
      insertedMetricCount: metricRows.length,
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
