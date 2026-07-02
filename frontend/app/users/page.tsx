'use client';

import { useEffect, useMemo, useState } from 'react';
import { SchoolsApi, UsersApi, type AppUser, type AppUserInput, type School, type UserFilter } from '@/lib/api';
import EditUserModal from '@/components/users/EditUserModal';
import UsersTable from '@/components/users/UsersTable';

const FILTERS: { value: UserFilter; label: string }[] = [
  { value: 'all', label: 'All users' },
  { value: 'power', label: 'Power users' },
  { value: 'notifications', label: 'Notifications only' },
  { value: 'district', label: 'District (000)' },
];

export default function UsersPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filter, setFilter] = useState<UserFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalUser, setModalUser] = useState<AppUser | null | 'new'>(null);

  useEffect(() => {
    SchoolsApi.list().then(setSchools).catch((err) => setError(err.message));
  }, []);

  async function refreshUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await UsersApi.list({ filter, search: search.trim() || undefined });
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(refreshUsers, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  const modalTarget = useMemo(() => (modalUser === 'new' ? null : modalUser), [modalUser]);

  async function handleSave(input: AppUserInput) {
    if (modalTarget) {
      await UsersApi.update(modalTarget.UserID, input);
    } else {
      await UsersApi.create(input);
    }
    setModalUser(null);
    await refreshUsers();
  }

  async function handleRemove(userId: number) {
    await UsersApi.remove(userId);
    setModalUser(null);
    await refreshUsers();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">User security maintenance</h1>
        </div>
        <button
          type="button"
          onClick={() => setModalUser('new')}
          className="rounded-md bg-hisd-blue px-4 py-2 text-sm font-medium text-white hover:bg-hisd-navy"
        >
          + Add user
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, Network ID, or school..."
        className="w-full rounded-md border border-hisd-gray-border bg-white px-4 py-2 text-sm shadow-sm"
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? 'border-hisd-blue bg-hisd-blue-light text-hisd-blue'
                : 'border-hisd-gray-border text-gray-600 hover:bg-hisd-gray'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-hisd-red">{error}</div>}

      <UsersTable users={users} loading={loading} onEdit={setModalUser} />

      {modalUser !== null && (
        <EditUserModal
          schools={schools}
          user={modalTarget}
          onSave={handleSave}
          onRemove={handleRemove}
          onClose={() => setModalUser(null)}
        />
      )}
    </div>
  );
}
