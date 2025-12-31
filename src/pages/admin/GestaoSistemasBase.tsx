import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Blocks, 
  Package, 
  Settings2, 
  Save,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface SistemaBase {
  id: string;
  nome: string;
  descricao: string | null;
  nicho: string;
  versao: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

interface Modulo {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  is_core: boolean;
  preco_mensal: number;
  status: 'active' | 'inactive' | 'pending';
}

interface SistemaModulo {
  modulo_id: string;
  is_default: boolean;
}

const NICHOS = [
  'Restaurante',
  'Clínica',
  'Academia',
  'Serviços',
  'Varejo',
  'Educação',
  'Imobiliária',
  'Contabilidade',
  'Advocacia',
  'Saúde',
  'Beleza',
  'Outro',
];

export default function GestaoSistemasBase() {
  const { user } = useAuth();
  const { logAudit } = useAuditLog();
  const { toast } = useToast();
  const [sistemas, setSistemas] = useState<SistemaBase[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSistema, setSelectedSistema] = useState<SistemaBase | null>(null);
  const [sistemaModulos, setSistemaModulos] = useState<SistemaModulo[]>([]);
  const [activeTab, setActiveTab] = useState('info');
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    nicho: '',
    versao: '1.0.0',
    status: 'active' as 'active' | 'inactive' | 'pending',
  });

  const isSuperAdmin = user?.role === 'SUPER_ADMIN_EVOLUTECH';

  useEffect(() => {
    fetchSistemas();
    fetchModulos();
  }, []);

  const fetchSistemas = async () => {
    const { data, error } = await supabase
      .from('sistemas_base')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar sistemas', variant: 'destructive' });
    } else {
      setSistemas(data || []);
    }
    setLoading(false);
  };

  const fetchModulos = async () => {
    const { data } = await supabase
      .from('modulos')
      .select('*')
      .order('is_core', { ascending: false })
      .order('nome');
    setModulos(data || []);
  };

  const fetchSistemaModulos = async (sistemaId: string) => {
    const { data } = await supabase
      .from('sistema_base_modulos')
      .select('modulo_id, is_default')
      .eq('sistema_base_id', sistemaId);
    
    setSistemaModulos(data || []);
  };

  const openEditSistema = async (sistema: SistemaBase) => {
    setSelectedSistema(sistema);
    setFormData({
      nome: sistema.nome,
      descricao: sistema.descricao || '',
      nicho: sistema.nicho,
      versao: sistema.versao,
      status: sistema.status,
    });
    await fetchSistemaModulos(sistema.id);
    setActiveTab('info');
    setIsDialogOpen(true);
  };

  const openNewSistema = () => {
    setSelectedSistema(null);
    setFormData({
      nome: '',
      descricao: '',
      nicho: '',
      versao: '1.0.0',
      status: 'active',
    });
    setSistemaModulos([]);
    setActiveTab('info');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.nicho) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      let sistemaId = selectedSistema?.id;

      if (selectedSistema) {
        // Update existing
        const { error } = await supabase
          .from('sistemas_base')
          .update(formData)
          .eq('id', selectedSistema.id);

        if (error) throw error;
        
        await logAudit({ 
          action: 'update', 
          entityType: 'sistemas_base', 
          entityId: selectedSistema.id, 
          details: formData 
        });
      } else {
        // Create new
        const { data, error } = await supabase
          .from('sistemas_base')
          .insert(formData)
          .select()
          .single();

        if (error) throw error;
        
        sistemaId = data.id;
        await logAudit({ 
          action: 'create', 
          entityType: 'sistemas_base', 
          entityId: data.id, 
          details: formData 
        });
      }

      // Save modules
      if (sistemaId) {
        // Delete existing
        await supabase
          .from('sistema_base_modulos')
          .delete()
          .eq('sistema_base_id', sistemaId);

        // Insert new
        if (sistemaModulos.length > 0) {
          const inserts = sistemaModulos.map(sm => ({
            sistema_base_id: sistemaId,
            modulo_id: sm.modulo_id,
            is_default: sm.is_default,
          }));

          await supabase.from('sistema_base_modulos').insert(inserts);
        }

        await logAudit({ 
          action: 'update', 
          entityType: 'sistema_base_modulos', 
          entityId: sistemaId, 
          details: { modulos: sistemaModulos.map(sm => ({ modulo_id: sm.modulo_id, is_default: sm.is_default })) } 
        });
      }

      toast({ title: selectedSistema ? 'Sistema atualizado!' : 'Sistema criado!' });
      setIsDialogOpen(false);
      fetchSistemas();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sistema: SistemaBase) => {
    if (!isSuperAdmin) {
      toast({ title: 'Sem permissão', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('sistemas_base')
      .delete()
      .eq('id', sistema.id);

    if (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    } else {
      await logAudit({ 
        action: 'delete', 
        entityType: 'sistemas_base', 
        entityId: sistema.id, 
        details: { nome: sistema.nome } 
      });
      toast({ title: 'Sistema excluído' });
      fetchSistemas();
    }
  };

  const toggleModulo = (moduloId: string) => {
    setSistemaModulos(prev => {
      const exists = prev.find(sm => sm.modulo_id === moduloId);
      if (exists) {
        return prev.filter(sm => sm.modulo_id !== moduloId);
      } else {
        return [...prev, { modulo_id: moduloId, is_default: false }];
      }
    });
  };

  const toggleModuloDefault = (moduloId: string) => {
    setSistemaModulos(prev => 
      prev.map(sm => 
        sm.modulo_id === moduloId 
          ? { ...sm, is_default: !sm.is_default }
          : sm
      )
    );
  };

  const isModuloSelected = (moduloId: string) => 
    sistemaModulos.some(sm => sm.modulo_id === moduloId);

  const isModuloDefault = (moduloId: string) => 
    sistemaModulos.find(sm => sm.modulo_id === moduloId)?.is_default || false;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Sistemas Base</h1>
          <p className="text-muted-foreground">
            Crie e configure templates de sistemas para seus clientes
          </p>
        </div>
        <Button onClick={openNewSistema} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Sistema Base
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sistemas Ativos</p>
                <p className="text-2xl font-bold">
                  {sistemas.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Blocks className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Módulos Disponíveis</p>
                <p className="text-2xl font-bold">
                  {modulos.filter(m => m.status === 'active').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nichos Cobertos</p>
                <p className="text-2xl font-bold">
                  {new Set(sistemas.map(s => s.nicho)).size}
                </p>
              </div>
              <Settings2 className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Systems Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : sistemas.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Blocks className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum sistema cadastrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie seu primeiro sistema base para começar
              </p>
              <Button onClick={openNewSistema}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Sistema
              </Button>
            </CardContent>
          </Card>
        ) : (
          sistemas.map((sistema) => (
            <Card key={sistema.id} className="relative overflow-hidden group">
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                sistema.status === 'active' ? 'bg-green-500' : 
                sistema.status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {sistema.nome}
                    </CardTitle>
                    <CardDescription>{sistema.descricao || 'Sem descrição'}</CardDescription>
                  </div>
                  <Badge variant="outline">{sistema.nicho}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Versão</span>
                  <span className="font-mono">{sistema.versao}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={sistema.status === 'active' ? 'default' : 'secondary'}>
                    {sistema.status === 'active' ? 'Ativo' : 
                     sistema.status === 'inactive' ? 'Inativo' : 'Pendente'}
                  </Badge>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => openEditSistema(sistema)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  {isSuperAdmin && (
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => handleDelete(sistema)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Blocks className="h-5 w-5" />
              {selectedSistema ? `Editar: ${selectedSistema.nome}` : 'Novo Sistema Base'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Informações
              </TabsTrigger>
              <TabsTrigger value="modulos" className="gap-2">
                <Package className="h-4 w-4" />
                Módulos ({sistemaModulos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Sistema *</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Sistema para Clínicas"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nicho">Nicho *</Label>
                  <Select
                    value={formData.nicho}
                    onValueChange={(v) => setFormData({ ...formData, nicho: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nicho" />
                    </SelectTrigger>
                    <SelectContent>
                      {NICHOS.map(nicho => (
                        <SelectItem key={nicho} value={nicho}>{nicho}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o propósito e funcionalidades principais do sistema..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="versao">Versão</Label>
                  <Input
                    id="versao"
                    placeholder="1.0.0"
                    value={formData.versao}
                    onChange={(e) => setFormData({ ...formData, versao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: 'active' | 'inactive' | 'pending') => 
                      setFormData({ ...formData, status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="modulos" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground mb-4">
                Selecione os módulos que fazem parte deste sistema. Marque como "Obrigatório" os módulos que devem estar sempre ativos.
              </div>

              {modulos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum módulo cadastrado. Crie módulos primeiro.
                </div>
              ) : (
                <div className="space-y-2">
                  {modulos.map((modulo) => {
                    const isSelected = isModuloSelected(modulo.id);
                    const isDefault = isModuloDefault(modulo.id);
                    
                    return (
                      <div
                        key={modulo.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          isSelected 
                            ? 'bg-primary/5 border-primary' 
                            : 'hover:bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleModulo(modulo.id)}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{modulo.nome}</span>
                              {modulo.is_core && (
                                <Badge variant="outline" className="text-xs">Core</Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {modulo.codigo}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {modulo.descricao || 'Sem descrição'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">
                            {modulo.preco_mensal > 0 ? formatCurrency(modulo.preco_mensal) : 'Grátis'}
                          </span>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`default-${modulo.id}`} className="text-xs text-muted-foreground">
                                Obrigatório
                              </Label>
                              <Switch
                                id={`default-${modulo.id}`}
                                checked={isDefault}
                                onCheckedChange={() => toggleModuloDefault(modulo.id)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {sistemaModulos.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-secondary/50">
                  <h4 className="font-medium mb-2">Resumo</h4>
                  <div className="flex flex-wrap gap-2">
                    {sistemaModulos.map(sm => {
                      const modulo = modulos.find(m => m.id === sm.modulo_id);
                      return modulo ? (
                        <Badge key={sm.modulo_id} variant={sm.is_default ? 'default' : 'outline'}>
                          {modulo.nome}
                          {sm.is_default && <CheckCircle className="h-3 w-3 ml-1" />}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Sistema
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
