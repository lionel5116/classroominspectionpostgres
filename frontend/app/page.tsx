'use client';

import { useEffect, useState } from 'react';
import { DashboardApi, SchoolsApi, type DashboardRange, type DashboardSummary, type School } from '@/lib/api';
import StatCard from '@/components/dashboard/StatCard';
import TempByDayChart from '@/components/dashboard/TempByDayChart';
import CleanlinessBySchoolChart from '@/components/dashboard/CleanlinessBySchoolChart';

const RANGES: { value: DashboardRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

const RANGE_NOUN: Record<DashboardRange, string> = {
  today: 'today',
  week: 'this week',
  month: 'this month',
};

export default function DashboardPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [range, setRange] = useState<DashboardRange>('today');
  const [schoolNumber, setSchoolNumber] = useState('all');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    SchoolsApi.list().then(setSchools).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    DashboardApi.summary({ range, schoolNumber })
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard data.'));
  }, [range, schoolNumber]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                range === r.value
                  ? 'border-hisd-blue bg-hisd-blue-light text-hisd-blue'
                  : 'border-hisd-gray-border text-gray-600 hover:bg-hisd-gray'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSchoolNumber('all')}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            schoolNumber === 'all'
              ? 'border-hisd-blue bg-hisd-blue-light text-hisd-blue'
              : 'border-hisd-gray-border text-gray-600 hover:bg-hisd-gray'
          }`}
        >
          All schools
        </button>
        {schools
          .filter((s) => s.SchoolNumber !== '000')
          .map((school) => (
            <button
              key={school.SchoolNumber}
              type="button"
              onClick={() => setSchoolNumber(school.SchoolNumber)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                schoolNumber === school.SchoolNumber
                  ? 'border-hisd-blue bg-hisd-blue-light text-hisd-blue'
                  : 'border-hisd-gray-border text-gray-600 hover:bg-hisd-gray'
              }`}
            >
              {school.SchoolNumber} — {school.SchoolName}
            </button>
          ))}
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-hisd-red">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={`Inspections ${RANGE_NOUN[range]}`} value={summary ? String(summary.inspectionsCount) : '—'} />
        <StatCard
          label={`Temp alerts ${RANGE_NOUN[range]}`}
          value={summary ? String(summary.tempAlerts) : '—'}
          valueClassName="text-hisd-red"
        />
        <StatCard
          label="Cleanliness alerts"
          value={summary ? String(summary.cleanlinessAlerts) : '—'}
          valueClassName="text-amber-700"
        />
        <StatCard
          label="Avg cleanliness"
          value={summary && summary.avgCleanliness !== null ? `${summary.avgCleanliness.toFixed(1)} ★` : '—'}
        />
      </div>

      {summary && (
        <>
          <TempByDayChart data={summary.tempByDay} />
          <CleanlinessBySchoolChart data={summary.cleanlinessBySchool} />
        </>
      )}
    </div>
  );
}
