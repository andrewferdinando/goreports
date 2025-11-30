"use client";

import { FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";

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
              <label
                htmlFor="auckland-csv"
                className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-sm font-semibold h-11 px-5 rounded-lg hover:shadow-md hover:-translate-y-[1px] transition-all cursor-pointer inline-block"
              >
                + Add CSV
              </label>
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
              <label
                htmlFor="christchurch-csv"
                className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-sm font-semibold h-11 px-5 rounded-lg hover:shadow-md hover:-translate-y-[1px] transition-all cursor-pointer inline-block"
              >
                + Add CSV
              </label>
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
              <label
                htmlFor="queenstown-csv"
                className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-sm font-semibold h-11 px-5 rounded-lg hover:shadow-md hover:-translate-y-[1px] transition-all cursor-pointer inline-block"
              >
                + Add CSV
              </label>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-sm font-semibold h-11 px-5 rounded-lg hover:shadow-md hover:-translate-y-[1px] transition-all"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

