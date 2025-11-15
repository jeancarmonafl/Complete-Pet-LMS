import { create } from 'zustand';
const getStoredLanguage = () => {
    if (typeof window === 'undefined')
        return 'en';
    const stored = localStorage.getItem('cp-language');
    return stored ?? 'en';
};
export const useLanguageStore = create((set) => ({
    language: getStoredLanguage(),
    setLanguage: (language) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cp-language', language);
        }
        set({ language });
    },
    toggleLanguage: () => set((state) => {
        const next = state.language === 'en' ? 'es' : 'en';
        if (typeof window !== 'undefined') {
            localStorage.setItem('cp-language', next);
        }
        return { language: next };
    })
}));
