import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireCompany?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  allowedRoles,
  requireCompany = false,
}) => {
  const { isAuthenticated, user, isLoading, getRedirectPath, company } = useAuth();
  const location = useLocation();

  // Log access attempts for security audit
  useEffect(() => {
    const logAccessAttempt = async (allowed: boolean) => {
      if (!user) return;
      
      // Only log denied attempts
      if (!allowed) {
        try {
          await supabase.from('audit_logs').insert({
            user_id: user.id,
            user_email: user.email,
            action: 'login' as const,
            entity_type: 'route_access',
            entity_id: null,
            company_id: user.tenantId || null,
            details: {
              path: location.pathname,
              allowed: false,
              reason: 'unauthorized_role',
              attempted_role: user.role,
              required_roles: allowedRoles,
            },
          });
        } catch (error) {
          console.error('Failed to log access attempt:', error);
        }
      }
    };

    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      logAccessAttempt(false);
    }
  }, [user, location.pathname, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the appropriate area for their role
    const redirectPath = getRedirectPath();
    return <Navigate to={redirectPath} replace />;
  }

  // Check company requirement for company users
  if (requireCompany && !user.tenantId) {
    return <Navigate to="/login" state={{ error: 'no_company' }} replace />;
  }

  return <>{children}</>;
};
