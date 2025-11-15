import { useTranslation } from 'react-i18next';

export default function ReportsPage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{t('reportsTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          {t('reportsSubtitle')}
        </p>
      </header>
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Department
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <option>All departments</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Job Title
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <option>All positions</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Course
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <option>All courses</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Date Range
            <input type="date" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">Run Report</button>
          <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300">Export CSV</button>
        </div>
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
          Configure filters and run a report to preview analytics. Results can be exported for audits and supervisor reviews.
        </div>
      </section>
    </div>
  );
}
