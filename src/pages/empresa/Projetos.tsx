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
import { toast } from 'sonner';
import { Plus, FolderKanban, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pendente: 'bg-muted text-muted-foreground',
  em_andamento: 'bg-primary/20 text-primary',
  concluido: 'bg-green-500/20 text-green-400',
  cancelado: 'bg-destructive/20 text-destructive',
};

const prioridadeColors: Record<string, string> = {
  baixa: 'bg-muted text-muted-foreground',
  media: 'bg-primary/20 text-primary',
  alta: 'bg-orange-500/20 text-orange-400',
  critica: 'bg-destructive/20 text-destructive',
};

const Projetos: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ nome: '', descricao: '' });
  const [newTask, setNewTask] = useState({ titulo: '', descricao: '', prioridade: 'media', prazo: '' });

  const companyId = user?.tenantId;

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('projects').insert({
        company_id: companyId!,
        nome: newProject.nome,
        descricao: newProject.descricao,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setProjectDialogOpen(false);
      setNewProject({ nome: '', descricao: '' });
      toast.success('Projeto criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar projeto'),
  });

  const createTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tasks').insert({
        company_id: companyId!,
        project_id: selectedProjectId,
        titulo: newTask.titulo,
        descricao: newTask.descricao,
        prioridade: newTask.prioridade,
        prazo: newTask.prazo || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTaskDialogOpen(false);
      setNewTask({ titulo: '', descricao: '', prioridade: 'media', prazo: '' });
      toast.success('Tarefa criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar tarefa'),
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

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
          <h1 className="text-2xl font-bold">Projetos e Tarefas</h1>
          <p className="text-muted-foreground">Gerencie seus projetos e acompanhe o progresso</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Título" value={newTask.titulo} onChange={e => setNewTask(p => ({ ...p, titulo: e.target.value }))} />
                <Textarea placeholder="Descrição" value={newTask.descricao} onChange={e => setNewTask(p => ({ ...p, descricao: e.target.value }))} />
                <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
                  <SelectTrigger><SelectValue placeholder="Projeto (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={newTask.prioridade} onValueChange={v => setNewTask(p => ({ ...p, prioridade: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={newTask.prazo} onChange={e => setNewTask(p => ({ ...p, prazo: e.target.value }))} />
                <Button className="w-full" onClick={() => createTask.mutate()} disabled={!newTask.titulo || createTask.isPending}>
                  {createTask.isPending ? 'Criando...' : 'Criar Tarefa'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Novo Projeto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Nome do projeto" value={newProject.nome} onChange={e => setNewProject(p => ({ ...p, nome: e.target.value }))} />
                <Textarea placeholder="Descrição" value={newProject.descricao} onChange={e => setNewProject(p => ({ ...p, descricao: e.target.value }))} />
                <Button className="w-full" onClick={() => createProject.mutate()} disabled={!newProject.nome || createProject.isPending}>
                  {createProject.isPending ? 'Criando...' : 'Criar Projeto'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Projects grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => {
          const projectTasks = tasks.filter(t => t.project_id === project.id);
          const done = projectTasks.filter(t => t.status === 'concluido').length;
          return (
            <Card key={project.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    {project.nome}
                  </CardTitle>
                  <Badge className={statusColors[project.status] || ''}>{project.status}</Badge>
                </div>
                {project.descricao && <p className="text-sm text-muted-foreground mt-1">{project.descricao}</p>}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{projectTasks.length} tarefas</span>
                  <span>{done} concluídas</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tasks list */}
      <Card className="border-border">
        <CardHeader><CardTitle>Tarefas</CardTitle></CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma tarefa criada ainda</p>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateTaskStatus.mutate({ id: task.id, status: task.status === 'concluido' ? 'pendente' : 'concluido' })}>
                      {task.status === 'concluido' ? <CheckCircle className="h-5 w-5 text-green-400" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <div>
                      <p className={cn('text-sm font-medium', task.status === 'concluido' && 'line-through text-muted-foreground')}>{task.titulo}</p>
                      {task.prazo && <p className="text-xs text-muted-foreground">Prazo: {new Date(task.prazo).toLocaleDateString('pt-BR')}</p>}
                    </div>
                  </div>
                  <Badge className={prioridadeColors[task.prioridade || 'media']}>{task.prioridade}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Projetos;
