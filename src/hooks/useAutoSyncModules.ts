import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Auto-syncs all available modules to a company if none exist yet.
 * Runs once after login when empresa_modulos is empty.
 */
export const useAutoSyncModules = () => {
  const { user } = useAuth();
  const didSync = useRef(false);

  useEffect(() => {
    const companyId = user?.tenantId;
    if (!companyId || didSync.current) return;
    if (user.role !== 'DONO_EMPRESA') return;

    const sync = async () => {
      try {
        // Check if company already has modules
        const { count } = await supabase
          .from('empresa_modulos')
          .select('id', { count: 'exact', head: true })
          .eq('empresa_id', companyId);

        if (count && count > 0) {
          didSync.current = true;
          return;
        }

        // No modules — seed all active modules
        const { data: allModules } = await supabase
          .from('modulos')
          .select('id')
          .eq('status', 'active');

        if (!allModules || allModules.length === 0) return;

        const inserts = allModules.map(m => ({
          empresa_id: companyId,
          modulo_id: m.id,
          ativo: true,
        }));

        await supabase
          .from('empresa_modulos')
          .upsert(inserts, { onConflict: 'empresa_id,modulo_id' });

        didSync.current = true;
      } catch (err) {
        console.error('Auto-sync modules error:', err);
      }
    };

    sync();
  }, [user?.tenantId, user?.role]);
};
