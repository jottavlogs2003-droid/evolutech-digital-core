import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User as AppUser, UserRole, AuthState, dbRoleToUserRole, DbRole, Company } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  company: Company | null;
  isEvolutechUser: boolean;
  isCompanyUser: boolean;
  getRedirectPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const fetchCompanyData = useCallback(async (companyId: string): Promise<Company | null> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (error || !data) return null;
      
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        plan: data.plan,
        status: data.status,
        monthly_revenue: data.monthly_revenue || 0,
        logo_url: data.logo_url || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('Error fetching company data:', error);
      return null;
    }
  }, []);

  const fetchUserData = useCallback(async (userId: string, email: string): Promise<AppUser | null> => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, company_id, companies(name)')
        .eq('user_id', userId)
        .maybeSingle();

      if (!roleData) {
        // User exists but has no role — return a minimal user so we can redirect to onboarding
        setCompany(null);
        return {
          id: userId,
          email,
          name: profile?.full_name || email,
          role: 'NO_ROLE' as any,
          createdAt: new Date(profile?.created_at || Date.now()),
        };
      }

      const role = dbRoleToUserRole(roleData.role as DbRole);
      const companyInfo = roleData.companies as { name: string } | null;

      // Fetch company data if user belongs to a company
      if (roleData.company_id) {
        const companyData = await fetchCompanyData(roleData.company_id);
        setCompany(companyData);
      } else {
        setCompany(null);
      }

      return {
        id: userId,
        email: email,
        name: profile?.full_name || email,
        role,
        tenantId: roleData.company_id || undefined,
        tenantName: companyInfo?.name || undefined,
        avatar: profile?.avatar_url || undefined,
        createdAt: new Date(profile?.created_at || Date.now()),
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, [fetchCompanyData]);

  // Get redirect path based on role
  const getRedirectPath = useCallback((): string => {
    if (!authState.user) return '/login';
    
    switch (authState.user.role) {
      case 'SUPER_ADMIN_EVOLUTECH':
        return '/admin-evolutech';
      case 'ADMIN_EVOLUTECH':
        return '/admin-evolutech/operacional';
      case 'DONO_EMPRESA':
        return '/empresa/dashboard';
      case 'FUNCIONARIO_EMPRESA':
        return '/empresa/app';
      default:
        // Users without a role should go to onboarding to create their system
        return '/onboarding';
    }
  }, [authState.user]);

  // Check if user is Evolutech team
  const isEvolutechUser = authState.user?.role === 'SUPER_ADMIN_EVOLUTECH' || 
                          authState.user?.role === 'ADMIN_EVOLUTECH';

  // Check if user is company user
  const isCompanyUser = authState.user?.role === 'DONO_EMPRESA' || 
                        authState.user?.role === 'FUNCIONARIO_EMPRESA';

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to avoid deadlock
          setTimeout(async () => {
            const userData = await fetchUserData(session.user.id, session.user.email || '');
            setAuthState({
              user: userData,
              isAuthenticated: !!userData,
              isLoading: false,
            });
          }, 0);
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          setCompany(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email || '').then((userData) => {
          setAuthState({
            user: userData,
            isAuthenticated: !!userData,
            isLoading: false,
          });
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw new Error(error.message);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw new Error(error.message);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    setCompany(null);
  }, []);

  const hasPermission = useCallback((requiredRoles: UserRole[]) => {
    if (!authState.user) return false;
    return requiredRoles.includes(authState.user.role);
  }, [authState.user]);

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      signup, 
      logout, 
      hasPermission,
      company,
      isEvolutechUser,
      isCompanyUser,
      getRedirectPath,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
