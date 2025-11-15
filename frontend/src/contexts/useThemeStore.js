import { create } from 'zustand';
const getStoredTheme = () => {
    if (typeof window === 'undefined')
        return 'light';
    const stored = localStorage.getItem('cp-theme');
    return stored ?? 'light';
};
export const useThemeStore = create((set) => ({
    theme: getStoredTheme(),
    setTheme: (theme) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cp-theme', theme);
            document.documentElement.classList.toggle('dark', theme === 'dark');
        }
        set({ theme });
    },
    toggleTheme: () => set((state) => {
        const nextTheme = state.theme === 'light' ? 'dark' : 'light';
        if (typeof window !== 'undefined') {
            localStorage.setItem('cp-theme', nextTheme);
            document.documentElement.classList.toggle('dark', nextTheme === 'dark');
        }
        return { theme: nextTheme };
    })
}));
export function initializeTheme() {
    if (typeof window === 'undefined')
        return;
    const stored = getStoredTheme();
    document.documentElement.classList.toggle('dark', stored === 'dark');
}
