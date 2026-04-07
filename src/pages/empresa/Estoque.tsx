import React, { useState } from 'react';
import { useCompanyData } from '@/hooks/useCompanyData';
import { PageHeader } from '@/components/crud/PageHeader';
import { SearchFilters } from '@/components/crud/SearchFilters';
import { DataTable } from '@/components/crud/DataTable';
import { FormDialog } from '@/components/crud/FormDialog';
import { StatusBadge } from '@/components/crud/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Warehouse, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

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

const typeLabels: Record<string, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
};

const Estoque: React.FC = () => {
  const { data, loading, totalCount, pagination, setPagination, filters, setFilters, create, remove, refresh } = useCompanyData<StockMovement>('stock_movements', ['notes'], 'created_at');
  const [formOpen, setFormOpen] = useState(false);

  const columns = [
    { key: 'type' as const, label: 'Tipo', render: (row: StockMovement) => (
      <Badge variant={row.type === 'entrada' ? 'default' : row.type === 'saida' ? 'destructive' : 'secondary'} className="flex items-center gap-1 w-fit">
        {row.type === 'entrada' ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
        {typeLabels[row.type] || row.type}
      </Badge>
    )},
    { key: 'quantity' as const, label: 'Quantidade', render: (row: StockMovement) => <span className="font-medium">{row.quantity}</span> },
    { key: 'unit_cost' as const, label: 'Custo Unitário', render: (row: StockMovement) => row.unit_cost ? `R$ ${Number(row.unit_cost).toFixed(2)}` : '-' },
    { key: 'notes' as const, label: 'Observações', render: (row: StockMovement) => row.notes || '-' },
    { key: 'created_at' as const, label: 'Data', render: (row: StockMovement) => new Date(row.created_at).toLocaleDateString('pt-BR') },
  ];

  const formFields = [
    { name: 'type', label: 'Tipo', type: 'select' as const, required: true, options: [
      { value: 'entrada', label: 'Entrada' },
      { value: 'saida', label: 'Saída' },
      { value: 'ajuste', label: 'Ajuste' },
    ]},
    { name: 'quantity', label: 'Quantidade', type: 'number' as const, required: true },
    { name: 'unit_cost', label: 'Custo Unitário', type: 'number' as const },
    { name: 'product_id', label: 'ID do Produto', type: 'text' as const, required: true },
    { name: 'notes', label: 'Observações', type: 'textarea' as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Controle de Estoque" description="Gerencie entradas, saídas e ajustes de estoque" icon={Warehouse} onAdd={() => setFormOpen(true)} addLabel="Nova Movimentação" />
      <SearchFilters filters={filters} onFilterChange={setFilters} searchPlaceholder="Buscar movimentações..." />
      <DataTable columns={columns} data={data} loading={loading} totalCount={totalCount} pagination={pagination} onPaginationChange={setPagination} onDelete={(row) => remove(row.id)} />
      <FormDialog open={formOpen} onOpenChange={setFormOpen} title="Nova Movimentação" fields={formFields} onSubmit={async (values) => { await create(values); setFormOpen(false); }} />
    </div>
  );
};

export default Estoque;
