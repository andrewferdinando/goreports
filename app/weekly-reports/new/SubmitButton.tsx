'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PrimaryButton from '@/components/ui/PrimaryButton';

interface SubmitButtonProps {
  reportId: string | null;
  isSubmitting: boolean;
}

export function SubmitButton({ reportId, isSubmitting }: SubmitButtonProps) {
  const router = useRouter();
  const [isParsing, setIsParsing] = useState(false);

  const handleParseAndRedirect = async () => {
    if (!reportId) return;

    setIsParsing(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/parse`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse CSVs');
      }

      // Redirect to report detail page
      router.push(`/weekly-reports/${reportId}`);
    } catch (error) {
      console.error('Error parsing CSVs:', error);
      alert(error instanceof Error ? error.message : 'Failed to parse CSVs');
      setIsParsing(false);
    }
  };

  if (reportId && !isSubmitting && !isParsing) {
    handleParseAndRedirect();
  }

  return (
    <>
      <PrimaryButton type="submit" disabled={isSubmitting || isParsing}>
        {isSubmitting ? 'Creating Report...' : isParsing ? 'Parsing CSVs...' : 'Submit'}
      </PrimaryButton>
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
    </>
  );
}

