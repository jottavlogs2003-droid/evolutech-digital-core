import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Building2, Users, Package, UserCheck, UserPlus, Search,
  MoreVertical, Ban, KeyRound, Trash2, Power, Settings2, Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  logo_url: string | null;
  created_at: string;
  niche: string | null;
  user_count?: number;
  active_modules?: number;
  active_users_today?: number;
}

interface UserLite {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

const AdminClientes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN_EVOLUTECH';

  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  const [resetDialog, setResetDialog] = useState<{ open: boolean; userId: string; email: string }>({
    open: false, userId: '', email: '',
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, userRes, modRes] = await Promise.all([
        supabase.from('companies').select('id, name, slug, status, logo_url, created_at, niche').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, email, full_name, is_active, company_id, created_at, updated_at'),
        supabase.from('empresa_modulos').select('empresa_id, ativo').eq('ativo', true),
      ]);

      const companyData = compRes.data || [];
      const userData = userRes.data || [];
      const modData = modRes.data || [];

      const enriched: CompanyRow[] = companyData.map((c: any) => {
        const cUsers = userData.filter((u: any) => u.company_id === c.id);
        const cModules = modData.filter((m: any) => m.empresa_id === c.id).length;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const activeToday = cUsers.filter((u: any) =>
          u.is_active && new Date(u.updated_at) >= today
        ).length;
        return {
          ...c,
          user_count: cUsers.length,
          active_modules: cModules,
          active_users_today: activeToday,
        };
      });

      setCompanies(enriched);
      setUsers(userData);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const newClientsToday = companies.filter(c => new Date(c.created_at) >= today).length;
    const activeUsersToday = users.filter(u => u.is_active && new Date(u.updated_at) >= today).length;
    const totalActiveModules = companies.reduce((sum, c) => sum + (c.active_modules || 0), 0);
    return {
      totalCompanies: companies.length,
      activeCompanies: companies.filter(c => c.status === 'active').length,
      totalUsers: users.length,
      activeUsersToday,
      newClientsToday,
      totalActiveModules,
    };
  }, [companies, users]);

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return companies.filter(c =>
      c.name.toLowerCase().includes(t) ||
      c.slug.toLowerCase().includes(t) ||
      (c.niche || '').toLowerCase().includes(t)
    );
  }, [companies, search]);

  const callAction = async (payload: any, successMsg: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-actions', { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(successMsg);
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Erro na operação');
    }
  };

  const handleBlockCompany = (c: CompanyRow) => {
    const blocking = c.status === 'active';
    setConfirmDialog({
      open: true,
      title: blocking ? 'Bloquear cliente?' : 'Desbloquear cliente?',
      description: blocking
        ? `Isso bloqueia "${c.name}" e todos os usuários da empresa. Eles não conseguirão acessar até o desbloqueio.`
        : `Reativar "${c.name}" e seus usuários.`,
      onConfirm: () => callAction(
        { action: blocking ? 'block_company' : 'unblock_company', company_id: c.id },
        blocking ? 'Cliente bloqueado' : 'Cliente desbloqueado',
      ),
    });
  };

  const handleDeleteCompany = (c: CompanyRow) => {
    setConfirmDialog({
      open: true,
      title: 'Excluir cliente permanentemente?',
      description: `Esta ação remove a empresa "${c.name}". Não pode ser desfeita.`,
      onConfirm: async () => {
        const { error } = await supabase.from('companies').delete().eq('id', c.id);
        if (error) toast.error(error.message);
        else { toast.success('Cliente excluído'); loadData(); }
      },
    });
  };

  const handleResetOwnerPassword = async (c: CompanyRow) => {
    // Find owner of company
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('company_id', c.id)
      .eq('role', 'dono_empresa')
      .maybeSingle();
    if (!roleData?.user_id) return toast.error('Dono da empresa não encontrado');
    const owner = users.find(u => u.id === roleData.user_id);
    if (!owner) return toast.error('Perfil do dono não encontrado');
    setResetDialog({ open: true, userId: owner.id, email: owner.email });
    setNewPassword('');
  };

  const submitResetPassword = async () => {
    if (newPassword.length < 6) return toast.error('Senha deve ter no mínimo 6 caracteres');
    await callAction(
      { action: 'reset_password', user_id: resetDialog.userId, new_password: newPassword },
      'Senha redefinida',
    );
    setResetDialog({ open: false, userId: '', email: '' });
    setNewPassword('');
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold lg:text-3xl flex items-center gap-2">
          <Building2 className="h-7 w-7 text-primary" />
          Gestão de Clientes
        </h1>
        <p className="text-muted-foreground">Visão completa dos clientes da plataforma Nexify</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Building2} label="Total de Clientes" value={stats.totalCompanies} color="bg-primary/10 text-primary" />
        <StatCard icon={Power} label="Clientes Ativos" value={stats.activeCompanies} color="bg-green-500/10 text-green-500" />
        <StatCard icon={Package} label="Módulos Ativos" value={stats.totalActiveModules} color="bg-purple-500/10 text-purple-500" />
        <StatCard icon={Users} label="Usuários Totais" value={stats.totalUsers} color="bg-blue-500/10 text-blue-500" />
        <StatCard icon={UserCheck} label="Ativos Hoje" value={stats.activeUsersToday} color="bg-emerald-500/10 text-emerald-500" />
        <StatCard icon={UserPlus} label="Novos Hoje" value={stats.newClientsToday} color="bg-amber-500/10 text-amber-500" />
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle>Clientes</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Nicho</TableHead>
                    <TableHead className="text-center">Usuários</TableHead>
                    <TableHead className="text-center">Módulos</TableHead>
                    <TableHead className="text-center">Ativos hoje</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {c.logo_url ? (
                            <img src={c.logo_url} alt={c.name} className="h-9 w-9 rounded object-cover" />
                          ) : (
                            <div className="h-9 w-9 rounded bg-primary/10 text-primary flex items-center justify-center">
                              <Building2 className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{c.niche || '—'}</TableCell>
                      <TableCell className="text-center">{c.user_count}</TableCell>
                      <TableCell className="text-center">{c.active_modules}</TableCell>
                      <TableCell className="text-center">{c.active_users_today}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>
                          {c.status === 'active' ? 'Ativa' : 'Bloqueada'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate('/admin-evolutech/empresas')}>
                              <Eye className="h-4 w-4 mr-2" /> Ver / Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/admin-evolutech/empresas')}>
                              <Settings2 className="h-4 w-4 mr-2" /> Alterar Módulos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetOwnerPassword(c)}>
                              <KeyRound className="h-4 w-4 mr-2" /> Resetar Senha do Dono
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleBlockCompany(c)}>
                              <Ban className="h-4 w-4 mr-2" />
                              {c.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                            </DropdownMenuItem>
                            {isSuperAdmin && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteCompany(c)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir Cliente
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog(p => ({ ...p, open: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(p => ({ ...p, open: false })); }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset password dialog */}
      <Dialog open={resetDialog.open} onOpenChange={(o) => setResetDialog(p => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>Definir nova senha para <b>{resetDialog.email}</b></DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nova senha (mín. 6 caracteres)</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog({ open: false, userId: '', email: '' })}>
              Cancelar
            </Button>
            <Button onClick={submitResetPassword}>Redefinir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClientes;
