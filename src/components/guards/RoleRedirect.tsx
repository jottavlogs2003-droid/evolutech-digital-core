import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component that redirects authenticated users to their role-specific area
 * Used on login success or when accessing root paths
 */
export const RoleRedirect: React.FC = () => {
  const { isAuthenticated, isLoading, getRedirectPath } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const redirectPath = getRedirectPath();
  return <Navigate to={redirectPath} replace />;
};
