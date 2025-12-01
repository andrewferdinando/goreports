'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { AddProductRuleModal } from './AddProductRuleModal';

interface ProductRule {
  id: string;
  location_name: string;
  product_pattern: string;
  category: string;
  match_type: string;
  arcade_group_label: string | null;
  is_active: boolean;
}

export default function ProductRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<ProductRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>('All venues');
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (locationFilter !== 'All venues') {
      params.append('location_name', locationFilter);
    }
    if (searchText) {
      params.append('search', searchText);
    }

    try {
      const response = await fetch(`/api/settings/product-rules?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch rules');
      }

      setRules(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rules');
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  }, [locationFilter, searchText]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchText(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchRules();
    alert('Rule added.');
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Home > Settings > Product Rules"
        title="Product Rules"
        action={
          <PrimaryButton onClick={() => setShowAddModal(true)}>
            Add product rule
          </PrimaryButton>
        }
      />

      <p className="text-sm text-[#374151] mb-6">
        When a new product appears in the CSV, add a rule here so the app knows whether it's a combo, non combo, arcade, or other.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Venue
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="All venues">All venues</option>
              <option value="Auckland">Auckland</option>
              <option value="Christchurch">Christchurch</option>
              <option value="Queenstown">Queenstown</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by product name..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading && (
          <div className="p-6 text-center text-sm text-[#374151]">
            Loading rules...
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            {rules.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#374151]">
                No rules found.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-[#D1D5DB]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Venue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Product name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Match type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Arcade group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Active
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#D1D5DB]">
                  {rules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                        {rule.location_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                        {rule.product_pattern}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                        {rule.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                        {rule.match_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                        {rule.arcade_group_label || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rule.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <AddProductRuleModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
}

