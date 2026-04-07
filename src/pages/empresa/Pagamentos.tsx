import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign, TrendingUp, QrCode } from 'lucide-react';

const Pagamentos: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          Pagamentos e Assinaturas
        </h1>
        <p className="text-muted-foreground">Gerencie seus meios de pagamento e cobranças</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Faturamento', value: 'R$ 0,00', icon: DollarSign, color: 'text-emerald-500' },
          { title: 'Cobranças Pendentes', value: '0', icon: TrendingUp, color: 'text-amber-500' },
          { title: 'PIX Recebidos', value: '0', icon: QrCode, color: 'text-blue-500' },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <CreditCard className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h3 className="font-semibold text-lg">Módulo de Pagamentos</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Configure gateways de pagamento, gere cobranças PIX e gerencie assinaturas recorrentes dos seus clientes.
          </p>
          <Badge variant="secondary" className="mt-4">Em desenvolvimento</Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pagamentos;
