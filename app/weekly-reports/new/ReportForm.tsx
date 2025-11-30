'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createWeeklyReport } from './actions';
import { CsvUploadFields } from './CsvUploadFields';
import PrimaryButton from '@/components/ui/PrimaryButton';

export function ReportForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Call server action to create report
      const result = await createWeeklyReport(formData);
      
      if (!result || !result.reportId) {
        throw new Error('Failed to create report');
      }

      setIsSubmitting(false);
      setIsParsing(true);

      // Trigger CSV parsing
      const parseResponse = await fetch(`/api/reports/${result.reportId}/parse`, {
        method: 'POST',
      });

      if (!parseResponse.ok) {
        const error = await parseResponse.json();
        throw new Error(error.error || 'Failed to parse CSVs');
      }

      // Redirect to report detail page
      router.push(`/weekly-reports/${result.reportId}`);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
      setIsSubmitting(false);
      setIsParsing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-1">
          Week start
        </label>
        <input
          type="date"
          name="period_start"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          required
          disabled={isSubmitting || isParsing}
        />
      </div>

      <CsvUploadFields />

      <div className="mt-6">
        <PrimaryButton type="submit" disabled={isSubmitting || isParsing}>
          {isSubmitting ? 'Creating Report...' : isParsing ? 'Parsing CSVs...' : 'Submit'}
        </PrimaryButton>
      </div>

      {(isSubmitting || isParsing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md">
            <h3 className="text-lg font-semibold text-[#0A0A0A] mb-2">
              {isSubmitting ? 'Creating Report' : 'Parsing CSVs'}
            </h3>
            <p className="text-sm text-[#374151]">
              {isSubmitting
                ? 'Please wait while we create your report...'
                : 'Processing your CSV files. This may take a moment...'}
            </p>
          </div>
        </div>
      )}
    </form>
  );
}

