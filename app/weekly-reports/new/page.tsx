"use client";

import { FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

export default function NewWeeklyReportPage() {
  const router = useRouter();
  const aucklandRef = useRef<HTMLInputElement>(null);
  const christchurchRef = useRef<HTMLInputElement>(null);
  const queenstownRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const files = {
      auckland: aucklandRef.current?.files?.[0],
      christchurch: christchurchRef.current?.files?.[0],
      queenstown: queenstownRef.current?.files?.[0],
    };

    console.log("Selected files:", files);

    router.push("/weekly-reports");
  };

  return (
    <div>
      <PageHeader breadcrumb="Home > New report" title="New report" />

      <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-sm text-[#374151]">
              Add Auckland CSV
            </label>
            <div>
              <input
                ref={aucklandRef}
                type="file"
                accept=".csv"
                className="hidden"
                id="auckland-csv"
              />
              <SecondaryButton
                type="button"
                onClick={() => aucklandRef.current?.click()}
              >
                + Add CSV
              </SecondaryButton>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-[#374151]">
              Add Christchurch CSV
            </label>
            <div>
              <input
                ref={christchurchRef}
                type="file"
                accept=".csv"
                className="hidden"
                id="christchurch-csv"
              />
              <SecondaryButton
                type="button"
                onClick={() => christchurchRef.current?.click()}
              >
                + Add CSV
              </SecondaryButton>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-[#374151]">
              Add Queenstown CSV
            </label>
            <div>
              <input
                ref={queenstownRef}
                type="file"
                accept=".csv"
                className="hidden"
                id="queenstown-csv"
              />
              <SecondaryButton
                type="button"
                onClick={() => queenstownRef.current?.click()}
              >
                + Add CSV
              </SecondaryButton>
            </div>
          </div>

          <div className="mt-6">
            <PrimaryButton type="submit">Submit</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

