import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plug, MessageSquare, CreditCard, Mail, Globe, Smartphone } from 'lucide-react';

const integrations = [
  { name: 'WhatsApp Business', description: 'Envie mensagens automáticas para seus clientes', icon: MessageSquare, status: 'disponivel' },
  { name: 'Gateway de Pagamento', description: 'Receba pagamentos online com cartão e PIX', icon: CreditCard, status: 'disponivel' },
  { name: 'Email SMTP', description: 'Configure envio de emails transacionais', icon: Mail, status: 'em_breve' },
  { name: 'Website / Landing Page', description: 'Integre formulários com seu CRM', icon: Globe, status: 'em_breve' },
  { name: 'App Mobile', description: 'Acesse o sistema pelo celular como app', icon: Smartphone, status: 'em_breve' },
];

const Integracoes: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Plug className="h-6 w-6 text-primary" />
          Integrações
        </h1>
        <p className="text-muted-foreground">Conecte ferramentas e serviços externos ao seu sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((int) => (
          <Card key={int.name}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <int.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{int.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">{int.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <Badge variant={int.status === 'disponivel' ? 'default' : 'secondary'}>
                  {int.status === 'disponivel' ? 'Disponível' : 'Em breve'}
                </Badge>
                {int.status === 'disponivel' && (
                  <Button size="sm" variant="outline">Configurar</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Integracoes;
