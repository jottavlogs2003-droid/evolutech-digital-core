import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { TenantsList } from '@/components/dashboard/TenantsList';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  HeadphonesIcon,
  Clock,
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN_EVOLUTECH';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground">
          {isSuperAdmin 
            ? 'Visão geral completa da plataforma Evolutech' 
            : 'Gerencie operações e suporte aos clientes'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Empresas"
          value="0"
          change={{ value: 0, label: 'este mês' }}
          icon={Building2}
        />
        <StatsCard
          title="Usuários Ativos"
          value="0"
          change={{ value: 0, label: 'este mês' }}
          icon={Users}
        />
        {isSuperAdmin && (
          <>
            <StatsCard
              title="MRR Total"
              value="R$ 0"
              change={{ value: 0, label: 'este mês' }}
              icon={CreditCard}
            />
            <StatsCard
              title="Taxa de Retenção"
              value="0%"
              change={{ value: 0, label: 'este mês' }}
              icon={TrendingUp}
            />
          </>
        )}
        <StatsCard
          title="Tickets Abertos"
          value="0"
          change={{ value: 0, label: 'esta semana' }}
          icon={HeadphonesIcon}
        />
        <StatsCard
          title="SLA Cumprido"
          value="0%"
          change={{ value: 0, label: 'este mês' }}
          icon={Clock}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        <TenantsList />
      </div>
    </div>
  );
};

export default AdminDashboard;
