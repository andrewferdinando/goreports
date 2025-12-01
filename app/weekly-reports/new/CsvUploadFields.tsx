'use client';

import React, { useRef, useState } from 'react';
import SecondaryButton from '@/components/ui/SecondaryButton';

export function CsvUploadFields() {
  const aklInputRef = useRef<HTMLInputElement | null>(null);
  const chcInputRef = useRef<HTMLInputElement | null>(null);
  const qtInputRef = useRef<HTMLInputElement | null>(null);

  const [aklFileName, setAklFileName] = useState<string | null>(null);
  const [chcFileName, setChcFileName] = useState<string | null>(null);
  const [qtFileName, setQtFileName] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Auckland */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-medium text-[#374151]">
            Auckland CSV
          </span>
          <span className="text-xs text-[#6B7280]">
            Upload the weekly CSV for Auckland
          </span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SecondaryButton
            type="button"
            onClick={() => aklInputRef.current?.click()}
            className="flex-shrink-0"
          >
            + Add CSV
          </SecondaryButton>
          <span className="text-xs text-[#6B7280] truncate">
            {aklFileName ?? 'No file selected'}
          </span>
        </div>
        <input
          ref={aklInputRef}
          type="file"
          name="csv_auckland"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setAklFileName(file ? file.name : null);
          }}
        />
      </div>

      {/* Christchurch */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-medium text-[#374151]">
            Christchurch CSV
          </span>
          <span className="text-xs text-[#6B7280]">
            Upload the weekly CSV for Christchurch
          </span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SecondaryButton
            type="button"
            onClick={() => chcInputRef.current?.click()}
            className="flex-shrink-0"
          >
            + Add CSV
          </SecondaryButton>
          <span className="text-xs text-[#6B7280] truncate">
            {chcFileName ?? 'No file selected'}
          </span>
        </div>
        <input
          ref={chcInputRef}
          type="file"
          name="csv_christchurch"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setChcFileName(file ? file.name : null);
          }}
        />
      </div>

      {/* Queenstown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-medium text-[#374151]">
            Queenstown CSV
          </span>
          <span className="text-xs text-[#6B7280]">
            Upload the weekly CSV for Queenstown
          </span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SecondaryButton
            type="button"
            onClick={() => qtInputRef.current?.click()}
            className="flex-shrink-0"
          >
            + Add CSV
          </SecondaryButton>
          <span className="text-xs text-[#6B7280] truncate">
            {qtFileName ?? 'No file selected'}
          </span>
        </div>
        <input
          ref={qtInputRef}
          type="file"
          name="csv_queenstown"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setQtFileName(file ? file.name : null);
          }}
        />
      </div>
    </div>
  );
}

