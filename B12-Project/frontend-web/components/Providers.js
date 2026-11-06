'use client';
import { MotionConfig } from 'framer-motion';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/UI';
import { LanguageProvider } from '@/i18n/LanguageProvider';

export default function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <AppProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </AppProvider>
      </LanguageProvider>
    </MotionConfig>
  );
}
