'use client';

import { useState, useEffect, ReactNode } from 'react';
import PrimaryButton from '@/components/ui/PrimaryButton';

interface SettingsPinGuardProps {
  children: ReactNode;
}

const STORAGE_KEY = 'goReportsSettingsUnlocked';

export default function SettingsPinGuard({ children }: SettingsPinGuardProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unlocked = localStorage.getItem(STORAGE_KEY) === 'true';
      setIsUnlocked(unlocked);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pin.trim()) {
      setError('Please enter a PIN');
      return;
    }

    setIsSubmitting(true);

    // Get PIN from environment variable
    const correctPin = process.env.NEXT_PUBLIC_GO_REPORTS_SETTINGS_PIN;

    if (!correctPin) {
      setError('PIN configuration error. Please contact support.');
      setIsSubmitting(false);
      return;
    }

    // Compare PINs
    if (pin === correctPin) {
      // Store unlock state in localStorage
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsUnlocked(true);
      setPin('');
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }

    setIsSubmitting(false);
  };

  // Show loading state while checking localStorage
  if (isUnlocked === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-[#6B7280]">Loading...</div>
      </div>
    );
  }

  // If unlocked, show children
  if (isUnlocked) {
    return <>{children}</>;
  }

  // Show PIN entry form
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8 max-w-md w-full mx-4">
        <h2 className="text-xl lg:text-2xl font-semibold text-[#0A0A0A] mb-2">
          Enter PIN to access Settings
        </h2>
        <p className="text-sm text-[#6B7280] mb-6">
          Please enter your PIN to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-[#374151] mb-1">
              PIN
            </label>
            <input
              type="password"
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              required
              disabled={isSubmitting}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <PrimaryButton type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? 'Checking...' : 'Submit'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

