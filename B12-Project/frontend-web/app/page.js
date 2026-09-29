'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/UI';

export default function RootPage() {
  const { state } = useApp();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated)         router.replace('/dashboard');
    else if (state.riskResult)   router.replace('/score-preview');
    else if (state.onboardingDone) router.replace('/questionnaire');
    else                         router.replace('/onboarding');
  }, [isLoading, isAuthenticated, state]);

  return <LoadingScreen />;
}
