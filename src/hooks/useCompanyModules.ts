import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CompanyModule {
  id: string;
  codigo: string;
  nome: string;
  icone: string | null;
  is_core: boolean;
  ativo: boolean;
  obrigatorio: boolean;
}

const mapCompanyModules = (data: any[]): CompanyModule[] => {
  return data
    .filter((item) => item.modulos)
    .map((item) => ({
      id: item.id,
      codigo: item.modulos.codigo?.toLowerCase() || '',
      nome: item.modulos.nome,
      icone: item.modulos.icone,
      is_core: Boolean(item.modulos.is_core),
      ativo: Boolean(item.ativo),
      obrigatorio: Boolean(item.obrigatorio),
    }));
};

export const useCompanyModules = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = user?.tenantId;

  const fetchModules = useCallback(async (): Promise<CompanyModule[]> => {
    if (!companyId) return [];

    try {
      const { data, error } = await supabase
        .from('empresa_modulos')
        .select(`
          id,
          ativo,
          obrigatorio,
          modulos (
            id,
            codigo,
            nome,
            icone,
            is_core
          )
        `)
        .eq('empresa_id', companyId)
        .eq('ativo', true);

      if (error) {
        console.error('Error fetching company modules:', error);
        return [];
      }

      return data ? mapCompanyModules(data) : [];
    } catch (err) {
      console.error('Error in useCompanyModules:', err);
      return [];
    }
  }, [companyId]);

  const {
    data: modules = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['company-modules', companyId],
    queryFn: fetchModules,
    enabled: Boolean(companyId),
    staleTime: 30_000,
  });

  const activeCodes = useMemo(
    () => modules.map((module) => module.codigo),
    [modules]
  );

  const hasModule = useCallback((moduleCode: string): boolean => {
    return activeCodes.includes(moduleCode.toLowerCase());
  }, [activeCodes]);

  const refreshModules = useCallback(async () => {
    if (!companyId) return;

    await queryClient.invalidateQueries({
      queryKey: ['company-modules', companyId],
    });
  }, [companyId, queryClient]);

  return {
    modules,
    activeCodes,
    isLoading: Boolean(companyId) ? isLoading || isFetching : false,
    hasModule,
    refreshModules,
  };
};

// Sync modules from template to company
export const syncCompanyModules = async (companyId: string, sistemaBaseId: string): Promise<boolean> => {
  try {
    // Get modules from template
    const { data: templateModules, error: templateError } = await supabase
      .from('sistema_base_modulos')
      .select('modulo_id, is_default')
      .eq('sistema_base_id', sistemaBaseId);

    if (templateError) {
      console.error('Error fetching template modules:', templateError);
      return false;
    }

    if (!templateModules || templateModules.length === 0) {
      // If no template modules, add core modules
      const { data: coreModules } = await supabase
        .from('modulos')
        .select('id')
        .eq('is_core', true)
        .eq('status', 'active');

      if (coreModules) {
        const coreInserts = coreModules.map(m => ({
          empresa_id: companyId,
          modulo_id: m.id,
          ativo: true,
          obrigatorio: true,
        }));

        await supabase.from('empresa_modulos').upsert(coreInserts, {
          onConflict: 'empresa_id,modulo_id',
        });
      }
      return true;
    }

    // Insert modules for company
    const inserts = templateModules.map(tm => ({
      empresa_id: companyId,
      modulo_id: tm.modulo_id,
      ativo: true,
      obrigatorio: tm.is_default,
    }));

    const { error: insertError } = await supabase
      .from('empresa_modulos')
      .upsert(inserts, {
        onConflict: 'empresa_id,modulo_id',
      });

    if (insertError) {
      console.error('Error syncing company modules:', insertError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in syncCompanyModules:', err);
    return false;
  }
};
