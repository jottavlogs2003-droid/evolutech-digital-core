import React, { useState } from 'react';
import { useCompanyData } from '@/hooks/useCompanyData';
import { PageHeader } from '@/components/crud/PageHeader';
import { SearchFilters } from '@/components/crud/SearchFilters';
import { DataTable, Column } from '@/components/crud/DataTable';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface StockMovement {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  unit_cost: number | null;
  notes: string | null;
  reference_type: string | null;
  created_at: string;
}

const Estoque: React.FC = () => {
  const { data, loading, totalCount, pagination, setPagination, filters, setFilters, remove } = useCompanyData<StockMovement>('stock_movements', ['notes'], 'created_at');

  const columns: Column<StockMovement>[] = [
    { key: 'type', label: 'Tipo', render: (row) => (
      <Badge variant={row.type === 'entrada' ? 'default' : row.type === 'saida' ? 'destructive' : 'secondary'} className="flex items-center gap-1 w-fit">
        {row.type === 'entrada' ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
        {row.type === 'entrada' ? 'Entrada' : row.type === 'saida' ? 'Saída' : 'Ajuste'}
      </Badge>
    )},
    { key: 'quantity', label: 'Quantidade', render: (row) => <span className="font-medium">{row.quantity}</span> },
    { key: 'unit_cost', label: 'Custo Unitário', render: (row) => row.unit_cost ? `R$ ${Number(row.unit_cost).toFixed(2)}` : '-' },
    { key: 'notes', label: 'Observações', render: (row) => row.notes || '-' },
    { key: 'created_at', label: 'Data', render: (row) => new Date(row.created_at).toLocaleDateString('pt-BR') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Controle de Estoque" description="Gerencie entradas, saídas e ajustes de estoque" />
      <SearchFilters
        searchValue={filters.search || ''}
        onSearchChange={(value) => setFilters({ ...filters, search: value })}
        searchPlaceholder="Buscar movimentações..."
        statusOptions={[
          { value: 'entrada', label: 'Entradas' },
          { value: 'saida', label: 'Saídas' },
          { value: 'ajuste', label: 'Ajustes' },
        ]}
        statusValue={filters.status}
        onStatusChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
        showClear={!!filters.search || !!filters.status}
        onClear={() => setFilters({})}
      />
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        totalCount={totalCount}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        onPageSizeChange={(pageSize) => setPagination({ ...pagination, pageSize, page: 1 })}
        onDelete={(row) => remove(row.id)}
        emptyMessage="Nenhuma movimentação de estoque"
      />
    </div>
  );
};

export default Estoque;
