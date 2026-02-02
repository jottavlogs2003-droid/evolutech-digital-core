import { supabase } from '@/integrations/supabase/client';

/**
 * Sync specific modules to a company
 * This allows for custom module selection during company creation
 */
export const syncCustomModulesToCompany = async (
  companyId: string,
  moduleIds: string[]
): Promise<boolean> => {
  if (!companyId || moduleIds.length === 0) {
    return false;
  }

  try {
    // First, get info about which modules are core
    const { data: modulesInfo, error: modulesError } = await supabase
      .from('modulos')
      .select('id, is_core')
      .in('id', moduleIds);

    if (modulesError) {
      console.error('Error fetching modules info:', modulesError);
      return false;
    }

    // Prepare inserts
    const inserts = moduleIds.map(moduleId => {
      const moduleInfo = modulesInfo?.find(m => m.id === moduleId);
      return {
        empresa_id: companyId,
        modulo_id: moduleId,
        ativo: true,
        obrigatorio: moduleInfo?.is_core || false,
      };
    });

    // Upsert modules
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
    console.error('Error in syncCustomModulesToCompany:', err);
    return false;
  }
};

/**
 * Get modules for a company
 */
export const getCompanyModules = async (companyId: string) => {
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

  return data || [];
};
