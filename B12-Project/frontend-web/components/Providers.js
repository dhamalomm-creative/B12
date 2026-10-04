'use client';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/UI';

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AppProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
