'use client';

import { useState } from 'react';
import type { AppUser, AppUserInput, School } from '@/lib/api';

interface EditUserModalProps {
  schools: School[];
  user: AppUser | null; // null = "add user" mode
  onSave: (input: AppUserInput) => Promise<void>;
  onRemove: (userId: number) => Promise<void>;
  onClose: () => void;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-gray-800">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-hisd-blue' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function EditUserModal({ schools, user, onSave, onRemove, onClose }: EditUserModalProps) {
  const isEdit = user !== null;

  const [schoolNumber, setSchoolNumber] = useState(user?.SchoolNumber ?? '');
  const [networkId, setNetworkId] = useState(user?.NetworkID ?? '');
  const [fullName, setFullName] = useState(user?.FullName ?? '');
  const [isPowerUser, setIsPowerUser] = useState(user?.IsPowerUser ?? false);
  const [isNotificationRecipient, setIsNotificationRecipient] = useState(user?.IsNotificationRecipient ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSchoolName = schools.find((s) => s.SchoolNumber === schoolNumber)?.SchoolName ?? '';

  async function handleSave() {
    if (!schoolNumber || !networkId.trim() || !fullName.trim()) {
      setError('School, Network ID, and Username are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        schoolNumber,
        networkId: networkId.trim(),
        fullName: fullName.trim(),
        isPowerUser,
        isNotificationRecipient,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await onRemove(user.UserID);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-hisd-gray-border px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit user' : 'Add user'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-hisd-red">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                School number *
              </label>
              <select
                value={schoolNumber}
                onChange={(e) => setSchoolNumber(e.target.value)}
                className="w-full rounded-md border border-hisd-gray-border bg-hisd-gray px-3 py-2 text-sm"
              >
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school.SchoolNumber} value={school.SchoolNumber}>
                    {school.SchoolNumber} — {school.SchoolName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                School name
              </label>
              <div className="w-full rounded-md border border-hisd-gray-border bg-hisd-gray px-3 py-2 text-sm italic text-gray-400">
                {selectedSchoolName || 'Auto from school number'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Network ID *
              </label>
              <input
                type="text"
                value={networkId}
                onChange={(e) => setNetworkId(e.target.value)}
                className="w-full rounded-md border border-hisd-gray-border bg-hisd-gray px-3 py-2 text-sm"
                placeholder="jsmith01"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-hisd-gray-border bg-hisd-gray px-3 py-2 text-sm"
                placeholder="James Smith"
              />
            </div>
          </div>

          <div className="border-t border-hisd-gray-border pt-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Permissions</div>
            <ToggleRow
              label="Power user"
              description="Access to User Security Maintenance only"
              checked={isPowerUser}
              onChange={setIsPowerUser}
            />
            <ToggleRow
              label="Notification recipient"
              description="Receives out-of-range alert emails"
              checked={isNotificationRecipient}
              onChange={setIsNotificationRecipient}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-hisd-gray-border px-5 py-4">
          {isEdit ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving}
              className="rounded-md border border-hisd-red px-3 py-2 text-sm font-medium text-hisd-red hover:bg-red-50 disabled:opacity-50"
            >
              🗑 Remove user
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-hisd-gray-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-hisd-gray disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-hisd-blue px-4 py-2 text-sm font-medium text-white hover:bg-hisd-navy disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
