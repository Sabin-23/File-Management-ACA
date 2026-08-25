// src/components/ProtectedRoute.tsx
import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authClient } from '../lib/auth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const location = useLocation();

  if (isPending) {
    return <div className="loading-screen">Loading…</div>;
  }

  if (!session) {
    return <Navigate to="/auth/sign-in" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}