import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Logo } from '../components/Logo';

const locations = [
  { code: 'FL', name: 'Complete-Pet Florida' },
  { code: 'VT', name: 'Complete-Pet Vermont' }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSelect = (code: string) => {
    localStorage.setItem('cp-location', code);
    navigate(`/${code.toLowerCase()}/login`);
  };

  return (
    <div className="w-full max-w-3xl rounded-3xl bg-white p-12 shadow-card dark:bg-slate-900">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <Logo size="lg" />
        <h1 className="mt-6 text-3xl font-semibold text-slate-900 dark:text-white">{t('welcomeTitle')}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{t('welcomeSubtitle')}</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {locations.map((location) => (
          <button
            key={location.code}
            onClick={() => handleSelect(location.code)}
            className="group flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/80 p-8 text-center transition hover:border-primary hover:bg-white dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-primary dark:hover:bg-slate-800"
          >
            <div>
              <p className="text-xl font-semibold text-slate-900 dark:text-white">{location.name}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('clickToContinue')}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
