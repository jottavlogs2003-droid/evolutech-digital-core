import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Box, Trash2, Settings, Database, PlusCircle } from 'lucide-react';

const ModulosCustom: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = user?.tenantId;

  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [newModule, setNewModule] = useState({ nome: '', descricao: '' });
  const [newField, setNewField] = useState({ nome: '', tipo: 'text', obrigatorio: false });
  const [newRecordData, setNewRecordData] = useState<Record<string, string>>({});

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['custom_modules', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_modules')
        .select('*')
        .eq('empresa_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: fields = [] } = useQuery({
    queryKey: ['custom_fields', selectedModuleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('module_id', selectedModuleId!)
        .order('ordem', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedModuleId,
  });

  const { data: records = [] } = useQuery({
    queryKey: ['custom_records', selectedModuleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_records')
        .select('*')
        .eq('module_id', selectedModuleId!)
        .eq('empresa_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedModuleId && !!companyId,
  });

  const createModule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('custom_modules').insert({
        empresa_id: companyId!,
        nome: newModule.nome,
        descricao: newModule.descricao,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_modules'] });
      setModuleDialogOpen(false);
      setNewModule({ nome: '', descricao: '' });
      toast.success('Módulo criado!');
    },
    onError: () => toast.error('Erro ao criar módulo'),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_modules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_modules'] });
      if (selectedModuleId) setSelectedModuleId(null);
      toast.success('Módulo excluído');
    },
  });

  const createField = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('custom_fields').insert({
        module_id: selectedModuleId!,
        nome: newField.nome,
        tipo: newField.tipo,
        obrigatorio: newField.obrigatorio,
        ordem: fields.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_fields'] });
      setFieldDialogOpen(false);
      setNewField({ nome: '', tipo: 'text', obrigatorio: false });
      toast.success('Campo adicionado!');
    },
    onError: () => toast.error('Erro ao criar campo'),
  });

  const deleteField = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_fields').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_fields'] });
      toast.success('Campo removido');
    },
  });

  const createRecord = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('custom_records').insert({
        module_id: selectedModuleId!,
        empresa_id: companyId!,
        dados: newRecordData,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_records'] });
      setRecordDialogOpen(false);
      setNewRecordData({});
      toast.success('Registro adicionado!');
    },
    onError: () => toast.error('Erro ao criar registro'),
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_records'] });
      toast.success('Registro excluído');
    },
  });

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Módulos Personalizados</h1>
          <p className="text-muted-foreground">Crie módulos com campos e dados totalmente customizados</p>
        </div>
        <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Novo Módulo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Módulo Personalizado</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nome do módulo" value={newModule.nome} onChange={e => setNewModule(p => ({ ...p, nome: e.target.value }))} />
              <Textarea placeholder="Descrição" value={newModule.descricao} onChange={e => setNewModule(p => ({ ...p, descricao: e.target.value }))} />
              <Button className="w-full" onClick={() => createModule.mutate()} disabled={!newModule.nome || createModule.isPending}>
                {createModule.isPending ? 'Criando...' : 'Criar Módulo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Module list */}
        <div className="space-y-2">
          {modules.length === 0 ? (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center py-8">
                <Box className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum módulo criado</p>
              </CardContent>
            </Card>
          ) : (
            modules.map(mod => (
              <Card
                key={mod.id}
                className={`border-border cursor-pointer transition-colors ${selectedModuleId === mod.id ? 'ring-1 ring-primary' : ''}`}
                onClick={() => setSelectedModuleId(mod.id)}
              >
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{mod.nome}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={e => { e.stopPropagation(); deleteModule.mutate(mod.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Module detail */}
        {selectedModule ? (
          <div className="space-y-4">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" /> {selectedModule.nome} — Campos
                  </CardTitle>
                  <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><Plus className="mr-1 h-3 w-3" /> Campo</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Adicionar Campo</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Nome do campo" value={newField.nome} onChange={e => setNewField(p => ({ ...p, nome: e.target.value }))} />
                        <Select value={newField.tipo} onValueChange={v => setNewField(p => ({ ...p, tipo: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="select">Seleção</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button className="w-full" onClick={() => createField.mutate()} disabled={!newField.nome || createField.isPending}>
                          Adicionar Campo
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Adicione campos para definir a estrutura</p>
                ) : (
                  <div className="space-y-2">
                    {fields.map(f => (
                      <div key={f.id} className="flex items-center justify-between rounded-lg border border-border p-2 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{f.nome}</span>
                          <Badge variant="outline" className="text-xs">{f.tipo}</Badge>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive h-6 w-6 p-0" onClick={() => deleteField.mutate(f.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Records */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5" /> Registros
                  </CardTitle>
                  <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={fields.length === 0}><PlusCircle className="mr-1 h-3 w-3" /> Registro</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Novo Registro</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        {fields.map(f => (
                          <div key={f.id}>
                            <label className="text-sm font-medium mb-1 block">{f.nome}</label>
                            <Input
                              type={f.tipo === 'number' ? 'number' : f.tipo === 'date' ? 'date' : 'text'}
                              value={newRecordData[f.nome] || ''}
                              onChange={e => setNewRecordData(p => ({ ...p, [f.nome]: e.target.value }))}
                            />
                          </div>
                        ))}
                        <Button className="w-full" onClick={() => createRecord.mutate()} disabled={createRecord.isPending}>
                          Salvar Registro
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {records.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {fields.map(f => <TableHead key={f.id}>{f.nome}</TableHead>)}
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map(r => {
                          const dados = (r.dados || {}) as Record<string, unknown>;
                          return (
                            <TableRow key={r.id}>
                              {fields.map(f => <TableCell key={f.id}>{String(dados[f.nome] || '-')}</TableCell>)}
                              <TableCell>
                                <Button variant="ghost" size="sm" className="text-destructive h-6 w-6 p-0" onClick={() => deleteRecord.mutate(r.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Box className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Selecione um módulo para ver seus campos e registros</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ModulosCustom;
