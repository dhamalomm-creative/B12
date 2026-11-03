'use client';
import { MotionConfig } from 'framer-motion';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/UI';

export default function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </AppProvider>
    </MotionConfig>
  );
}
