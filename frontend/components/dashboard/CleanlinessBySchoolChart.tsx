import type { DashboardSummary } from '@/lib/api';

function barColor(rating: number) {
  if (rating >= 3.5) return 'bg-hisd-green';
  if (rating > 2.5) return 'bg-hisd-amber';
  return 'bg-hisd-red';
}

interface CleanlinessBySchoolChartProps {
  data: DashboardSummary['cleanlinessBySchool'];
}

export default function CleanlinessBySchoolChart({ data }: CleanlinessBySchoolChartProps) {
  return (
    <div className="rounded-lg border border-hisd-gray-border bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">Avg cleanliness rating by school</h2>
      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="text-sm text-gray-400">No inspections in this range yet.</div>
        ) : (
          data.map((school) => (
            <div key={school.schoolNumber} className="flex items-center gap-3">
              <div className="w-28 shrink-0 truncate text-sm text-gray-700">{school.schoolName}</div>
              <div className="h-4 flex-1 rounded-full bg-hisd-gray">
                <div
                  className={`h-4 rounded-full ${barColor(school.avgCleanliness)}`}
                  style={{ width: `${(school.avgCleanliness / 5) * 100}%` }}
                />
              </div>
              <div className="w-8 shrink-0 text-right text-sm font-medium text-gray-700">
                {school.avgCleanliness.toFixed(1)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
