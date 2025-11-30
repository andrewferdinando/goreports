'use server';

import Papa from 'papaparse';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

interface ProductRule {
  id: string;
  location_id: string;
  product_pattern: string;
  category: string;
  arcade_group_label: string | null;
  match_type: string;
}

interface CsvRow {
  [key: string]: string;
}

interface ProductRule {
  id: string;
  location_id: string;
  product_pattern: string;
  category: string;
  arcade_group_label: string | null;
  match_type: string;
}

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
      console.error(`Failed to download CSV for ${storagePath}`, downloadError);
      throw new Error(`Failed to download CSV: ${downloadError?.message}`);
    }

    // Convert blob to text
    const csvText = await csvData.text();

    // Parse CSV using papaparse
    const parseResult = Papa.parse<CsvRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors);
      throw new Error(`CSV parsing failed: ${parseResult.errors[0].message}`);
    }

    // Load product_rules for this location (exact match only)
    const { data: productRules, error: rulesError } = await supabase
      .from('product_rules')
      .select('*')
      .eq('location_id', locationId)
      .eq('match_type', 'exact');

    if (rulesError) {
      throw new Error(`Failed to load product rules: ${rulesError.message}`);
    }

    if (!productRules || productRules.length === 0) {
      throw new Error(`No product rules found for location ${locationId}`);
    }

    // Create a map of product_pattern -> rule for quick lookup
    const productRuleMap = new Map<string, ProductRule>();
    for (const rule of productRules) {
      productRuleMap.set(rule.product_pattern.trim().toLowerCase(), rule);
    }

    // STEP A: Clean CSV rows
    const cleanedRows = parseResult.data
      .map((row) => {
        // Trim all values
        const cleaned: CsvRow = {};
        for (const key in row) {
          cleaned[key.trim()] = String(row[key] || '').trim();
        }
        return cleaned;
      })
      .filter((row) => {
        // Ignore blank rows
        const hasContent = Object.values(row).some((val) => val.length > 0);
        if (!hasContent) return false;

        // Ignore header row (check if first cell looks like a header)
        const firstValue = Object.values(row)[0]?.toLowerCase() || '';
        if (firstValue.includes('staff') || firstValue.includes('product') || firstValue.includes('total')) {
          return false;
        }

        // Ignore rows containing "Self Serve"
        const rowText = Object.values(row).join(' ').toLowerCase();
        if (rowText.includes('self serve') || rowText.includes('self-serve')) {
          return false;
        }

        // Ignore rows containing "Volume Online"
        if (rowText.includes('volume online')) {
          return false;
        }

        // Ignore rows where "Total" column is blank or zero
        const totalValue = row['Total'] || row['total'] || '';
        const totalNum = parseFloat(totalValue);
        if (!totalValue || totalNum === 0 || isNaN(totalNum)) {
          return false;
        }

        return true;
      });

    // STEP B: Detect staff vs product and build records
    let currentStaff: string | null = null;
    const metricRows: Array<{
      report_id: string;
      location_id: string;
      user_id: string;
      product_name: string;
      category: string;
      arcade_group_label: string | null;
      quantity: number;
    }> = [];

    const staffNames = new Set<string>();
    const unmatchedProducts: string[] = [];

    // First pass: identify all staff names
    for (const row of cleanedRows) {
      const firstCell = Object.values(row)[0] || '';
      const firstCellLower = firstCell.toLowerCase().trim();
      const matchingRule = productRuleMap.get(firstCellLower);

      if (!matchingRule && firstCell.length > 0) {
        staffNames.add(firstCell);
      }
    }

    // STEP C: Auto-create users
    const userMap = new Map<string, string>(); // canonicalName -> userId

    for (const staffName of staffNames) {
      const canonicalName = staffName.trim().toLowerCase();

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('location_id', locationId)
        .eq('canonical_name', canonicalName)
        .single();

      if (existingUser) {
        userMap.set(canonicalName, existingUser.id as string);
      } else {
        // Create new user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            name: staffName.trim(),
            canonical_name: canonicalName,
            location_id: locationId,
          })
          .select()
          .single();

        if (userError || !newUser) {
          console.error(`Failed to create user ${staffName}`, userError);
          throw new Error(`Failed to create user: ${userError?.message}`);
        }

        userMap.set(canonicalName, newUser.id as string);
      }
    }

    // STEP D: Build metric rows with staff assignment
    for (const row of cleanedRows) {
      const firstCell = Object.values(row)[0] || '';
      const firstCellLower = firstCell.toLowerCase().trim();
      const matchingRule = productRuleMap.get(firstCellLower);

      if (matchingRule) {
        // This is a product row
        if (!currentStaff) {
          console.warn(`Product row without staff name: ${firstCell}`);
          unmatchedProducts.push(firstCell);
          continue; // Skip products without staff name
        }

        // Get quantity from "Volume In-Store" column or "Total"
        const quantityStr = row['Volume In-Store'] || row['Volume In Store'] || row['Total'] || row['total'] || '0';
        const quantity = parseFloat(quantityStr);

        if (isNaN(quantity)) {
          console.warn(`Invalid quantity for product ${firstCell}: ${quantityStr}`);
          continue;
        }

        // Get user_id for current staff
        const canonicalName = currentStaff.trim().toLowerCase();
        const userId = userMap.get(canonicalName);

        if (!userId) {
          console.warn(`No user found for staff: ${currentStaff}`);
          continue;
        }

        metricRows.push({
          report_id: reportId,
          location_id: locationId,
          user_id: userId,
          product_name: firstCell,
          category: matchingRule.category,
          arcade_group_label: matchingRule.arcade_group_label,
          quantity,
        });
      } else {
        // This might be a staff name row
        // If it's not a product and not blank, treat as staff
        if (firstCell.length > 0) {
          currentStaff = firstCell;
        }
      }
    }

    // Log unmatched products for future improvements
    if (unmatchedProducts.length > 0) {
      console.log(`Unmatched products for location ${locationId}:`, unmatchedProducts);
    }

    // Filter out rows without user_id (shouldn't happen, but safety check)
    const validMetricRows = metricRows.filter((row) => row.user_id);

    if (validMetricRows.length === 0) {
      console.warn(`No valid metric rows created for location ${locationId}`);
      continue;
    }

    // Batch insert metric_values
    const { error: insertError } = await supabase
      .from('metric_values')
      .insert(validMetricRows);

    if (insertError) {
      console.error(`Failed to insert metric values for location ${locationId}`, insertError);
      throw new Error(`Failed to insert metric values: ${insertError.message}`);
    }

    console.log(`Successfully parsed CSV for location ${locationId}: ${validMetricRows.length} metric rows created`);
  }

  return { success: true, message: 'CSVs parsed successfully' };
}

