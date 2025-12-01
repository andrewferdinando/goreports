'use client';

import { useEffect, useState } from 'react';
import PageHeader from "@/components/PageHeader";

interface UserFilter {
  staff_name: string;
  include_in_individual_reports: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/users');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggle = async (staffName: string, currentValue: boolean) => {
    const newValue = !currentValue;
    
    // Optimistic update
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.staff_name === staffName
          ? { ...user, include_in_individual_reports: newValue }
          : user
      )
    );

    try {
      const response = await fetch('/api/settings/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staff_name: staffName,
          include_in_individual_reports: newValue,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user filter');
      }
    } catch (err) {
      // Revert on error
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.staff_name === staffName
            ? { ...user, include_in_individual_reports: currentValue }
            : user
        )
      );
      alert(err instanceof Error ? err.message : 'Failed to update user filter');
    }
  };

  // Filter users by search text
  const filteredUsers = users.filter(user =>
    user.staff_name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        breadcrumb="Home > Settings > Users"
        title="Users"
      />

      <p className="text-sm text-[#374151] mb-6">
        Uncheck any users you don&apos;t want to appear in the Individual Arcade or Individual Sales reports. Their sales will still be counted in all other metrics.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Search
          </label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by user name..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23374151%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_12px_center] bg-no-repeat"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading && (
          <div className="p-4 lg:p-6 text-center text-xs lg:text-sm text-[#374151]">
            Loading users...
          </div>
        )}

        {error && (
          <div className="p-4 lg:p-6 text-center text-xs lg:text-sm text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            {filteredUsers.length === 0 ? (
              <div className="p-4 lg:p-6 text-center text-xs lg:text-sm text-[#374151]">
                {searchText ? 'No users found matching your search.' : 'No users found.'}
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-[#D1D5DB]">
                    <tr>
                      <th className="px-2 py-2 lg:px-6 lg:py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-2 py-2 lg:px-6 lg:py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                        Show in individual reports
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#D1D5DB]">
                    {filteredUsers.map((user) => (
                      <tr key={user.staff_name}>
                        <td className="px-2 py-2 lg:px-6 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-[#374151]">
                          {user.staff_name}
                        </td>
                        <td className="px-2 py-2 lg:px-6 lg:py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={user.include_in_individual_reports}
                            onChange={() => handleToggle(user.staff_name, user.include_in_individual_reports)}
                            className="h-4 w-4 text-[#6366F1] focus:ring-[#6366F1] border-gray-300 rounded"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

