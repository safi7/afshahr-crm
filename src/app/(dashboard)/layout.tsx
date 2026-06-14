'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return <LoadingSpinner fullScreen message="Loading..." />;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
