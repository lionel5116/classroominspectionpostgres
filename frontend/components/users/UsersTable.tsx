import type { AppUser } from '@/lib/api';

function Pill({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? 'bg-green-100 text-hisd-green' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {active ? '✓ Yes' : 'No'}
    </span>
  );
}

interface UsersTableProps {
  users: AppUser[];
  loading: boolean;
  onEdit: (user: AppUser) => void;
}

export default function UsersTable({ users, loading, onEdit }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-hisd-gray-border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-hisd-gray text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">School</th>
            <th className="px-4 py-3 font-medium">Network ID</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Power user</th>
            <th className="px-4 py-3 font-medium">Notification</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-hisd-gray-border">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                Loading...
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.UserID} className="hover:bg-hisd-gray/50">
                <td className="px-4 py-3">
                  <span className="rounded-full bg-hisd-gray px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {user.SchoolNumber} — {user.SchoolName}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-gray-700">{user.NetworkID}</td>
                <td className="px-4 py-3 text-gray-900">{user.FullName}</td>
                <td className="px-4 py-3">
                  <Pill active={user.IsPowerUser}>Power user</Pill>
                </td>
                <td className="px-4 py-3">
                  <Pill active={user.IsNotificationRecipient}>Notification</Pill>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="rounded-full border border-hisd-gray-border p-1.5 text-gray-500 hover:bg-hisd-gray"
                    aria-label={`Edit ${user.FullName}`}
                  >
                    ✎
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
