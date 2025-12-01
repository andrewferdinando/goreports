'use client';

import { useEffect, useState } from 'react';
import { getReportUploads, ReportUpload } from './actions';

interface UploadsModalProps {
  reportId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UploadsModal({ reportId, isOpen, onClose }: UploadsModalProps) {
  const [uploads, setUploads] = useState<ReportUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && reportId) {
      setIsLoading(true);
      setError(null);
      getReportUploads(reportId)
        .then((data) => {
          setUploads(data);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load uploads');
          setIsLoading(false);
        });
    }
  }, [isOpen, reportId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#0A0A0A]">CSV Uploads</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {isLoading && (
          <p className="text-sm text-[#374151] py-4">Loading uploads...</p>
        )}

        {error && (
          <p className="text-sm text-red-600 py-4">{error}</p>
        )}

        {!isLoading && !error && (
          <>
            {uploads.length === 0 ? (
              <p className="text-sm text-[#374151] py-4">No uploads found for this report.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-[#D1D5DB]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                        Venue
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                        File Name
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#D1D5DB]">
                    {uploads.map((upload) => (
                      <tr key={upload.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#374151]">
                          {upload.venueName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#374151]">
                          {upload.filename}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

