import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyModules } from '@/hooks/useCompanyModules';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Package, RefreshCw } from 'lucide-react';

interface ModuloCatalog {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
}

const GerenciarModulos: React.FC = () => {
  const { user } = useAuth();
  const { refreshModules } = useCompanyModules();
  const [allModules, setAllModules] = useState<ModuloCatalog[]>([]);
  const [activeModuleIds, setActiveModuleIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const companyId = user?.tenantId;

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);

    try {
      // Fetch all available modules
      const { data: catalog } = await supabase
        .from('modulos')
        .select('id, codigo, nome, descricao, icone')
        .eq('status', 'active')
        .order('nome');

      // Fetch company's active modules
      const { data: companyModules } = await supabase
        .from('empresa_modulos')
        .select('modulo_id, ativo')
        .eq('empresa_id', companyId);

      if (catalog) setAllModules(catalog);

      if (companyModules) {
        const active = new Set(
          companyModules.filter(m => m.ativo).map(m => m.modulo_id)
        );
        setActiveModuleIds(active);
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (moduleId: string, currentlyActive: boolean) => {
    if (!companyId) return;
    setTogglingId(moduleId);

    try {
      if (currentlyActive) {
        // Deactivate: update ativo to false
        const { error } = await supabase
          .from('empresa_modulos')
          .update({ ativo: false, data_desativacao: new Date().toISOString() })
          .eq('empresa_id', companyId)
          .eq('modulo_id', moduleId);

        if (error) throw error;

        setActiveModuleIds(prev => {
          const next = new Set(prev);
          next.delete(moduleId);
          return next;
        });
        toast.success('Módulo desativado');
      } else {
        // Activate: upsert
        const { error } = await supabase
          .from('empresa_modulos')
          .upsert(
            {
              empresa_id: companyId,
              modulo_id: moduleId,
              ativo: true,
              data_ativacao: new Date().toISOString(),
              data_desativacao: null,
            },
            { onConflict: 'empresa_id,modulo_id' }
          );

        if (error) throw error;

        setActiveModuleIds(prev => new Set([...prev, moduleId]));
        toast.success('Módulo ativado');
      }

      refreshModules();
    } catch (err) {
      console.error('Error toggling module:', err);
      toast.error('Erro ao alterar módulo');
    } finally {
      setTogglingId(null);
    }
  };

  const handleActivateAll = async () => {
    if (!companyId) return;
    setIsLoading(true);

    try {
      const inserts = allModules.map(m => ({
        empresa_id: companyId,
        modulo_id: m.id,
        ativo: true,
        data_ativacao: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('empresa_modulos')
        .upsert(inserts, { onConflict: 'empresa_id,modulo_id' });

      if (error) throw error;

      setActiveModuleIds(new Set(allModules.map(m => m.id)));
      refreshModules();
      toast.success('Todos os módulos ativados!');
    } catch (err) {
      console.error('Error activating all:', err);
      toast.error('Erro ao ativar módulos');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">Gerenciar Módulos</h1>
          <p className="text-muted-foreground">
            Ative ou desative os módulos do seu sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button size="sm" onClick={handleActivateAll}>
            Ativar Todos
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Módulos Disponíveis
          </CardTitle>
          <CardDescription>
            {activeModuleIds.size} de {allModules.length} módulos ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {allModules.map((mod) => {
              const isActive = activeModuleIds.has(mod.id);
              const isToggling = togglingId === mod.id;

              return (
                <div
                  key={mod.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-sm">{mod.nome}</p>
                    {mod.descricao && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {mod.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isToggling && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => handleToggle(mod.id, isActive)}
                      disabled={isToggling}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarModulos;
