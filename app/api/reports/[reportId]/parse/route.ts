import { NextRequest, NextResponse } from 'next/server';
import { parseReportCsvs } from '@/lib/server/reports/parseReportCsvs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const result = await parseReportCsvs(reportId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error parsing report CSVs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse CSVs' },
      { status: 500 }
    );
  }
}

