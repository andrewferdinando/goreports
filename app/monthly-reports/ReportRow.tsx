'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteReport } from './actions';
import { UploadsModal } from './UploadsModal';
import SecondaryButton from '@/components/ui/SecondaryButton';

interface ReportRowProps {
  reportId: string;
  reportName: string;
  period: string;
  createdDate: string;
  onDelete: () => void;
}

export function ReportRow({ reportId, reportName, period, createdDate, onDelete }: ReportRowProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUploadsModal, setShowUploadsModal] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteReport(reportId);
      onDelete();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete report');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewUploads = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUploadsModal(true);
  };

  return (
    <>
      <tr
        onClick={() => router.push(`/monthly-reports/${reportId}`)}
        className="hover:bg-gray-50 hover:shadow-md cursor-pointer transition-all"
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0A0A0A]">
          {reportName}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
          {period}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
          {createdDate}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <SecondaryButton
              onClick={handleViewUploads}
              className="text-xs"
            >
              View Uploads
            </SecondaryButton>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-[10px] hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </td>
      </tr>
      <UploadsModal
        reportId={reportId}
        isOpen={showUploadsModal}
        onClose={() => setShowUploadsModal(false)}
      />
    </>
  );
}

