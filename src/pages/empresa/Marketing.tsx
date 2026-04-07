import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Users, Mail, BarChart3, Target, Send } from 'lucide-react';

const Marketing: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          Marketing
        </h1>
        <p className="text-muted-foreground">Gerencie campanhas e acompanhe métricas de marketing</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Campanhas Ativas', value: '0', icon: Target, color: 'text-blue-500' },
          { title: 'Leads Captados', value: '0', icon: Users, color: 'text-green-500' },
          { title: 'Emails Enviados', value: '0', icon: Send, color: 'text-purple-500' },
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
          <Megaphone className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h3 className="font-semibold text-lg">Módulo de Marketing</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Crie campanhas de email marketing, gerencie leads e acompanhe métricas de conversão do seu negócio.
          </p>
          <Badge variant="secondary" className="mt-4">Em breve</Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default Marketing;
