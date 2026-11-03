'use client';
import { MotionConfig } from 'framer-motion';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/UI';

export default function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AppProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </AppProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
