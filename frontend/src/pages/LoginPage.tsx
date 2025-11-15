import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Logo } from '../components/Logo';
import { useAuthStore } from '../contexts/useAuthStore';
import api from '../services/apiClient';

interface LoginForm {
  identifier: string;
  password: string;
}

export default function LoginPage() {
  const { location } = useParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const { register, handleSubmit } = useForm<LoginForm>();
  const { t } = useTranslation();
  const locationCode = (location || '').toUpperCase();
  const locationName =
    locationCode === 'FL'
      ? t('florida')
      : locationCode === 'VT'
        ? t('vermont')
        : 'Complete-Pet';

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await api.post('/auth/login', {
        ...data,
        locationCode
      });
      return response.data as { token: string; user: { id: string; fullName: string; role: string; organizationId: string; locationId: string; locationCode: string } };
    },
    onSuccess: (data) => {
      setSession(data.token, data.user);
      navigate('/app/dashboard');
    }
  });

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-12 shadow-card dark:bg-slate-900">
      <div className="flex flex-col items-center text-center">
        {/* Logo */}
        <Logo size="xl" />
        
        {/* Title */}
        <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
          {t('loginTitle', { location: locationName })}
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
          {t('signInToContinue')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('email')}
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <EnvelopeIcon className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              {...register('identifier')}
              required
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              placeholder={t('loginPlaceholder')}
            />
          </div>
        </div>
        
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('password')}
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <LockClosedIcon className="h-5 w-5 text-slate-400" />
            <input
              type="password"
              {...register('password')}
              required
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              placeholder="········"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {mutation.isPending ? t('loading') : t('signIn')}
        </button>
        
        {mutation.isError && (
          <p className="text-center text-sm text-red-500">{t('invalidCredentials')}</p>
        )}
      </form>
    </div>
  );
}
