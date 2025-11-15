interface StatsCardProps {
  title: string;
  value: string;
  accent: string;
  subtitle?: string;
}

export function StatsCard({ title, value, accent, subtitle }: StatsCardProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${accent}`}>{title}</div>
      <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>}
    </div>
  );
}
