interface StatCardProps {
  label: string;
  value: string;
  valueClassName?: string;
}

export default function StatCard({ label, value, valueClassName = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="rounded-lg bg-hisd-gray p-5">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-3xl font-semibold ${valueClassName}`}>{value}</div>
    </div>
  );
}
