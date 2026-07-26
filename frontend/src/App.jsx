import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import AppRoutes from './routes/AppRoutes';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  // Using a fallback so the app doesn't crash if env is missing
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  React.useEffect(() => {
    const applyTheme = (themeMode) => {
      const root = document.documentElement;
      root.classList.remove('dark');
      if (themeMode === 'dark') {
        root.classList.add('dark');
      } else if (themeMode === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
          root.classList.add('dark');
        }
      }
    };

    const savedTheme = localStorage.getItem('theme-preference') || 'light';
    applyTheme(savedTheme);

    // Listen for system theme changes if set to system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      const currentTheme = localStorage.getItem('theme-preference') || 'light';
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <Provider store={store}>
          <ToastProvider>
            <LanguageProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </LanguageProvider>
          </ToastProvider>
        </Provider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
