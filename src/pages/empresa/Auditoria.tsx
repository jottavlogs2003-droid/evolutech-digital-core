import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollText, Search, Plus, Edit, Trash2, LogIn, Shield, Settings, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  user_email: string | null;
  created_at: string;
  details: any;
}

const actionConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  create: { icon: Plus, color: 'text-green-500 bg-green-500/10', label: 'Criação' },
  update: { icon: Edit, color: 'text-blue-500 bg-blue-500/10', label: 'Atualização' },
  delete: { icon: Trash2, color: 'text-red-500 bg-red-500/10', label: 'Exclusão' },
  login: { icon: LogIn, color: 'text-purple-500 bg-purple-500/10', label: 'Login' },
  logout: { icon: LogIn, color: 'text-gray-500 bg-gray-500/10', label: 'Logout' },
  activate: { icon: Shield, color: 'text-green-500 bg-green-500/10', label: 'Ativação' },
  deactivate: { icon: Shield, color: 'text-amber-500 bg-amber-500/10', label: 'Desativação' },
  invite: { icon: User, color: 'text-cyan-500 bg-cyan-500/10', label: 'Convite' },
  role_change: { icon: Shield, color: 'text-orange-500 bg-orange-500/10', label: 'Mudança de Papel' },
};

const entityLabels: Record<string, string> = {
  company: 'Empresa', user: 'Usuário', payment_gateway: 'Gateway',
  module: 'Módulo', system: 'Sistema', ticket: 'Ticket', profile: 'Perfil',
  customer: 'Cliente', product: 'Produto', order: 'Pedido', appointment: 'Agendamento',
};

const Auditoria: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const companyId = user?.tenantId;
      if (!companyId) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error) setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, [user?.tenantId]);

  const filtered = logs.filter(l =>
    !search || 
    l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    l.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase())
  );

  const getConfig = (action: string) => actionConfig[action] || { icon: Settings, color: 'text-gray-500 bg-gray-500/10', label: action };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          Auditoria e Logs
        </h1>
        <p className="text-muted-foreground">Histórico de ações realizadas no sistema</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar logs..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ScrollText className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((log) => {
                const config = getConfig(log.action);
                const Icon = config.icon;
                const entity = entityLabels[log.entity_type] || log.entity_type;
                return (
                  <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{config.label} de {entity}</p>
                      <p className="text-xs text-muted-foreground">{log.user_email || 'Sistema'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auditoria;
