import { useTranslation } from 'react-i18next';

const sections = [
  { name: 'General' },
  { name: 'Security' },
  { name: 'Notifications' },
  { name: 'Training' },
  { name: 'Compliance' },
  { name: 'Appearance' }
];

export default function SystemSettingsPage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{t('systemSettingsTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">{t('systemSettingsSubtitle')}</p>
      </header>
      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Organization Settings</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">Update company details, support information, and branding.</p>
          </div>
          <span className="rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">Location: Complete-Pet FL</span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-[200px_1fr]">
          <nav className="flex flex-col gap-2">
            {sections.map((section) => (
              <button
                key={section.name}
                className="rounded-xl border border-slate-200 px-4 py-2 text-left text-sm font-medium text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300"
              >
                {section.name}
              </button>
            ))}
          </nav>
          <form className="rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-inner dark:border-slate-800 dark:bg-slate-950/50">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Organization Name
                <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900" defaultValue="Complete-Pet" />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Primary Contact Email
                <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900" defaultValue="admin@complete-pet.com" />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Support Phone
                <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900" defaultValue="(305) 123-4567" />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Default Timezone
                <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900">
                  <option>Eastern Time</option>
                  <option>Central Time</option>
                  <option>Pacific Time</option>
                </select>
              </label>
              <label className="md:col-span-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Organization Logo URL
                <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900" defaultValue="https://cdn.complete-pet.com/assets/logo.png" />
              </label>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">Save General Settings</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
