import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, MessageSquare, Mail, Bell, Clock, Settings } from 'lucide-react';

const automations = [
  { id: '1', name: 'Boas-vindas ao Cliente', description: 'Envia mensagem automática quando um novo cliente é cadastrado', trigger: 'Novo Cliente', channel: 'WhatsApp', active: false, icon: MessageSquare },
  { id: '2', name: 'Lembrete de Agendamento', description: 'Lembra o cliente 24h antes do agendamento', trigger: 'Agendamento', channel: 'WhatsApp', active: false, icon: Clock },
  { id: '3', name: 'Confirmação de Pedido', description: 'Envia confirmação quando um pedido é criado', trigger: 'Novo Pedido', channel: 'Email', active: false, icon: Mail },
  { id: '4', name: 'Alerta de Estoque Baixo', description: 'Notifica quando produto atinge estoque mínimo', trigger: 'Estoque', channel: 'Notificação', active: false, icon: Bell },
];

const Automacao: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          Automação
        </h1>
        <p className="text-muted-foreground">Configure automações para otimizar seu atendimento e processos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {automations.map((auto) => (
          <Card key={auto.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <auto.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{auto.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">{auto.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={auto.active ? 'default' : 'secondary'}>
                  {auto.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">{auto.trigger}</Badge>
                  <Badge variant="outline" className="text-xs">{auto.channel}</Badge>
                </div>
                <Button size="sm" variant="outline" className="gap-1">
                  <Settings className="h-3 w-3" /> Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Zap className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <h3 className="font-semibold text-lg">Mais automações em breve</h3>
          <p className="text-sm text-muted-foreground mt-1">Novas automações serão adicionadas para otimizar ainda mais seu negócio</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Automacao;
