import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { 
  Users, HeadphonesIcon, GraduationCap, CheckCircle, ArrowRight,
  Package, ShoppingCart, Calendar, Wallet, TrendingUp, DollarSign,
  FileText, FolderKanban, Bell, BarChart3, Clock, AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DashboardStats {
  customers: number;
  products: number;
  orders: number;
  appointments: number;
  openTickets: number;
  revenue: number;
  pendingOrders: number;
  todayAppointments: number;
  projects: number;
  documents: number;
  unreadNotifications: number;
}

interface RecentItem {
  id: string;
  type: 'order' | 'customer' | 'appointment' | 'ticket';
  title: string;
  subtitle: string;
  date: string;
  status?: string;
  icon: React.ElementType;
  color: string;
}

const EmpresaDashboard: React.FC = () => {
  const { user, company } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.role === 'DONO_EMPRESA';
  const companyId = user?.tenantId;

  useEffect(() => {
    if (!companyId) return;
    
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const [
          customersRes, productsRes, ordersRes, appointmentsRes,
          ticketsRes, revenueRes, pendingOrdersRes, todayApptRes,
          projectsRes, documentsRes, notifRes,
          recentOrdersRes, recentCustomersRes, recentApptRes, recentTicketsRes,
        ] = await Promise.all([
          supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true),
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('tickets_suporte').select('id', { count: 'exact', head: true }).eq('empresa_id', companyId).in('status', ['aberto', 'em_andamento']),
          supabase.from('orders').select('total').eq('company_id', companyId).eq('status', 'concluido'),
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pendente'),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('scheduled_at', todayISO),
          supabase.from('projects').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('lida', false),
          supabase.from('orders').select('id, customer_name, total, status, created_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(3),
          supabase.from('customers').select('id, name, email, created_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(3),
          supabase.from('appointments').select('id, service_name, customer_name, scheduled_at, status').eq('company_id', companyId).order('created_at', { ascending: false }).limit(3),
          supabase.from('tickets_suporte').select('id, titulo, status, created_at').eq('empresa_id', companyId).order('created_at', { ascending: false }).limit(3),
        ]);

        const totalRevenue = (revenueRes.data || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        setStats({
          customers: customersRes.count || 0,
          products: productsRes.count || 0,
          orders: ordersRes.count || 0,
          appointments: appointmentsRes.count || 0,
          openTickets: ticketsRes.count || 0,
          revenue: totalRevenue,
          pendingOrders: pendingOrdersRes.count || 0,
          todayAppointments: todayApptRes.count || 0,
          projects: projectsRes.count || 0,
          documents: documentsRes.count || 0,
          unreadNotifications: notifRes.count || 0,
        });

        // Build recent activity
        const items: RecentItem[] = [];
        (recentOrdersRes.data || []).forEach(o => items.push({
          id: o.id, type: 'order',
          title: `Pedido - ${o.customer_name || 'Cliente'}`,
          subtitle: `R$ ${Number(o.total || 0).toFixed(2)}`,
          date: o.created_at, status: o.status,
          icon: ShoppingCart, color: 'text-blue-500 bg-blue-500/10',
        }));
        (recentCustomersRes.data || []).forEach(c => items.push({
          id: c.id, type: 'customer',
          title: `Novo cliente: ${c.name}`,
          subtitle: c.email || 'Sem email',
          date: c.created_at,
          icon: Users, color: 'text-green-500 bg-green-500/10',
        }));
        (recentApptRes.data || []).forEach(a => items.push({
          id: a.id, type: 'appointment',
          title: a.service_name,
          subtitle: a.customer_name || 'Cliente',
          date: a.scheduled_at, status: a.status,
          icon: Calendar, color: 'text-purple-500 bg-purple-500/10',
        }));
        (recentTicketsRes.data || []).forEach(t => items.push({
          id: t.id, type: 'ticket',
          title: t.titulo,
          subtitle: t.status || 'aberto',
          date: t.created_at, status: t.status || undefined,
          icon: HeadphonesIcon, color: 'text-orange-500 bg-orange-500/10',
        }));

        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentItems(items.slice(0, 8));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [companyId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pendente: { label: 'Pendente', variant: 'secondary' },
    em_andamento: { label: 'Em Andamento', variant: 'default' },
    concluido: { label: 'Concluído', variant: 'outline' },
    cancelado: { label: 'Cancelado', variant: 'destructive' },
    aberto: { label: 'Aberto', variant: 'secondary' },
    confirmado: { label: 'Confirmado', variant: 'default' },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-5 w-96" /></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const s = stats!;

  const mainStats = [
    ...(isOwner ? [{ title: 'Receita Total', value: formatCurrency(s.revenue), icon: DollarSign, desc: `${s.orders} pedidos realizados`, color: 'text-emerald-500' }] : []),
    { title: 'Clientes Ativos', value: String(s.customers), icon: Users, desc: 'cadastrados no sistema', color: 'text-blue-500' },
    { title: 'Pedidos Pendentes', value: String(s.pendingOrders), icon: ShoppingCart, desc: `de ${s.orders} total`, color: 'text-amber-500' },
    { title: 'Agenda Hoje', value: String(s.todayAppointments), icon: Calendar, desc: `${s.appointments} total agendamentos`, color: 'text-purple-500' },
    ...(!isOwner ? [{ title: 'Tickets Abertos', value: String(s.openTickets), icon: HeadphonesIcon, desc: 'aguardando atendimento', color: 'text-orange-500' }] : []),
  ];

  const secondaryStats = isOwner ? [
    { title: 'Produtos', value: s.products, icon: Package, path: '/empresa/produtos' },
    { title: 'Projetos', value: s.projects, icon: FolderKanban, path: '/empresa/projetos' },
    { title: 'Tickets Abertos', value: s.openTickets, icon: HeadphonesIcon, path: '/empresa/suporte' },
    { title: 'Documentos', value: s.documents, icon: FileText, path: '/empresa/documentos' },
  ] : [];

  const quickLinks = [
    { label: 'Novo Pedido', path: '/empresa/pedidos', icon: ShoppingCart },
    { label: 'Novo Agendamento', path: '/empresa/agendamentos', icon: Calendar },
    { label: 'Novo Cliente', path: '/empresa/clientes', icon: Users },
    { label: 'Abrir Ticket', path: '/empresa/suporte', icon: HeadphonesIcon },
    ...(isOwner ? [{ label: 'Ver Relatórios', path: '/empresa/relatorios', icon: BarChart3 }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground">
          {isOwner
            ? `Visão geral de ${company?.name || 'sua empresa'}`
            : 'Acesse suas tarefas e ferramentas'}
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.desc}</p>
                </div>
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10', stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats (Owner only) */}
      {isOwner && secondaryStats.length > 0 && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {secondaryStats.map((stat) => (
            <Link key={stat.title} to={stat.path}>
              <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Recent Activity + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity - takes 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Últimas movimentações do seu negócio</CardDescription>
          </CardHeader>
          <CardContent>
            {recentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">Nenhuma atividade ainda</p>
                <p className="text-sm text-muted-foreground mt-1">Comece criando clientes, pedidos ou agendamentos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={cn(
                        'flex items-center gap-4 animate-fade-in',
                        i !== recentItems.length - 1 && 'pb-4 border-b border-border'
                      )}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', item.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {item.status && statusMap[item.status] && (
                          <Badge variant={statusMap[item.status].variant} className="text-[10px]">
                            {statusMap[item.status].label}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button variant="outline" className="w-full justify-between mb-1">
                  <span className="flex items-center gap-2">
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ))}

            {s.unreadNotifications > 0 && (
              <Link to="/empresa/notificacoes">
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.unreadNotifications} notificações</p>
                    <p className="text-xs text-muted-foreground">não lidas</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmpresaDashboard;
