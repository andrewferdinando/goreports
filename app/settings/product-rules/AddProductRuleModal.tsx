'use client';

import { useState } from 'react';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';

interface AddProductRuleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddProductRuleModal({ onClose, onSuccess }: AddProductRuleModalProps) {
  const [venue, setVenue] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<string>('');
  const [arcadeGroupLabel, setArcadeGroupLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!venue || !productName || !category) {
      setError('Venue, product name, and category are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/settings/product-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location_name: venue,
          product_pattern: productName,
          category,
          arcade_group_label: category === 'arcade' ? arcadeGroupLabel : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create rule');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#0A0A0A]">Add Product Rule</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Venue <span className="text-red-500">*</span>
            </label>
            <select
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23374151%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_12px_center] bg-no-repeat"
            >
              <option value="">Select venue</option>
              <option value="Auckland">Auckland</option>
              <option value="Christchurch">Christchurch</option>
              <option value="Queenstown">Queenstown</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Product name (exact) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. 2 Go Kart Races (Adult)"
              required
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23374151%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_12px_center] bg-no-repeat"
            >
              <option value="">Select category</option>
              <option value="combo">combo</option>
              <option value="non_combo">non_combo</option>
              <option value="arcade">arcade</option>
              <option value="other">other</option>
            </select>
          </div>

          {category === 'arcade' && (
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">
                Arcade group label
              </label>
              <input
                type="text"
                value={arcadeGroupLabel}
                onChange={(e) => setArcadeGroupLabel(e.target.value)}
                placeholder="e.g. Spend $50, Spend $70"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <SecondaryButton
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Submit'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

