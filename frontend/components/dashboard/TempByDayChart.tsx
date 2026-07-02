import type { DashboardSummary } from '@/lib/api';

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

interface TempByDayChartProps {
  data: DashboardSummary['tempByDay'];
}

export default function TempByDayChart({ data }: TempByDayChartProps) {
  const byDate = new Map(data.map((d) => [toDateKey(new Date(d.day)), d]));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return { date, entry: byDate.get(toDateKey(date)) };
  });

  const temps = last7Days.map((d) => d.entry?.avgTemp).filter((t): t is number => t !== undefined);
  const min = temps.length ? Math.min(60, ...temps) : 60;
  const max = temps.length ? Math.max(90, ...temps) : 90;

  return (
    <div className="rounded-lg border border-hisd-gray-border bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">Average temperature by day (°F)</h2>
      <div className="flex h-40 items-stretch gap-3">
        {last7Days.map(({ date, entry }, i) => {
          const heightPct = entry ? ((entry.avgTemp - min) / (max - min || 1)) * 80 + 20 : 0;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                {entry ? (
                  <div
                    title={`${entry.avgTemp.toFixed(1)}°F`}
                    className={`w-full rounded-t-md ${entry.isAlert ? 'bg-hisd-red' : 'bg-hisd-blue'}`}
                    style={{ height: `${heightPct}%` }}
                  />
                ) : (
                  <div className="w-full rounded-t-md bg-hisd-gray-border" style={{ height: '4%' }} />
                )}
              </div>
              <div className="text-[11px] text-gray-500">{WEEKDAY_FORMAT.format(date)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
