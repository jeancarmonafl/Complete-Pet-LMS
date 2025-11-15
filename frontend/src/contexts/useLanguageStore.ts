import { create } from 'zustand';

export type SupportedLanguage = 'en' | 'es';

const getStoredLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('cp-language') as SupportedLanguage | null;
  return stored ?? 'en';
};

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getStoredLanguage(),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp-language', language);
    }
    set({ language });
  },
  toggleLanguage: () =>
    set((state) => {
      const next = state.language === 'en' ? 'es' : 'en';
      if (typeof window !== 'undefined') {
        localStorage.setItem('cp-language', next);
      }
      return { language: next };
    })
}));
