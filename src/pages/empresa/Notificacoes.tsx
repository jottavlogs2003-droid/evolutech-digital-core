import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const tipoIcons: Record<string, React.ElementType> = {
  info: Info,
  alerta: AlertTriangle,
  sucesso: CheckCircle,
};

const Notificacoes: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ lida: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.lida).map(n => n.id);
      if (unread.length === 0) return;
      for (const id of unread) {
        await supabase.from('notifications').update({ lida: true }).eq('id', id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter(n => !n.lida).length;

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
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-muted-foreground">{unreadCount} não lidas</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
            <Check className="mr-2 h-4 w-4" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const Icon = tipoIcons[notif.tipo || 'info'] || Info;
            return (
              <Card
                key={notif.id}
                className={cn(
                  'border-border cursor-pointer transition-colors',
                  !notif.lida && 'bg-primary/5 border-primary/20'
                )}
                onClick={() => !notif.lida && markAsRead.mutate(notif.id)}
              >
                <CardContent className="flex items-start gap-3 py-4">
                  <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', !notif.lida ? 'text-primary' : 'text-muted-foreground')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-sm font-medium', notif.lida && 'text-muted-foreground')}>{notif.titulo}</p>
                      {!notif.lida && <Badge className="bg-primary text-primary-foreground text-xs">Nova</Badge>}
                    </div>
                    {notif.mensagem && <p className="text-sm text-muted-foreground mt-1">{notif.mensagem}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(notif.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notificacoes;
