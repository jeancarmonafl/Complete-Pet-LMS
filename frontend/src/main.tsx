import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/index.css';
import './utils/i18n';
import { initializeTheme, useThemeStore } from './contexts/useThemeStore';

console.log('Main.tsx loaded');

// Initialize theme before rendering
try {
  initializeTheme();
  console.log('Theme initialized');
} catch (error) {
  console.error('Theme initialization failed:', error);
}

// Subscribe to theme changes
try {
  useThemeStore.subscribe((state) => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  });
  console.log('Theme subscription set up');
} catch (error) {
  console.error('Theme subscription failed:', error);
}

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
  document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Error</h1><p>Root element not found</p></div>';
  throw new Error('Root element not found');
}

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('Starting React render...');
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Environment:', import.meta.env.MODE);

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('Root created successfully');
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('React render completed');
  
  // Hide loading indicator after a short delay
  setTimeout(() => {
    const loading = document.getElementById('root-loading');
    if (loading && rootElement.children.length > 0) {
      loading.style.display = 'none';
      console.log('Loading indicator hidden');
    }
  }, 500);
} catch (error) {
  console.error('React render failed:', error);
  const loading = document.getElementById('root-loading');
  if (loading) loading.style.display = 'none';
  
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; max-width: 600px; margin: 50px auto; background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px;">
      <h1 style="color: #dc2626; margin-bottom: 16px;">❌ Application Failed to Start</h1>
      <p style="margin-bottom: 12px;">The application encountered an error during initialization.</p>
      <div style="background: white; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
        <strong>Error:</strong>
        <pre style="margin: 8px 0 0 0; overflow: auto; font-size: 12px;">${error}</pre>
      </div>
      <button onclick="window.location.reload()" style="background: #dc2626; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
        Reload Page
      </button>
    </div>
  `;
}
