import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/index.css';
import './utils/i18n';
import { initializeTheme, useThemeStore } from './contexts/useThemeStore';
// Initialize theme before rendering
initializeTheme();
// Subscribe to theme changes
useThemeStore.subscribe((state) => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
});
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element not found');
}
ReactDOM.createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(ErrorBoundary, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(BrowserRouter, { children: _jsx(AppRoutes, {}) }) }) }) }));
