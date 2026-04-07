import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PaginationOptions {
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

interface FilterOptions {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | undefined;
}

interface UseCompanyDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  pagination: PaginationOptions;
  setPagination: (pagination: PaginationOptions) => void;
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  refresh: () => void;
  create: (item: Record<string, unknown>) => Promise<T | null>;
  update: (id: string, item: Record<string, unknown>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
}

type TableName = 'customers' | 'products' | 'product_categories' | 'appointments' | 
  'orders' | 'order_items' | 'stock_movements' | 'cash_transactions' | 'accounts' |
  'tickets_suporte' | 'treinamentos' | 'profiles' | 'user_roles';

export function useCompanyData<T extends { id: string }>(
  tableName: TableName,
  searchFields: string[] = ['name'],
  defaultOrderBy: string = 'created_at'
): UseCompanyDataResult<T> {
  const { user } = useAuth();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const searchFieldsRef = useRef(searchFields);
  searchFieldsRef.current = searchFields;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    pageSize: 10,
    orderBy: defaultOrderBy,
    orderDirection: 'desc',
  });
  const [filters, setFilters] = useState<FilterOptions>({});

  const companyId = user?.tenantId;

  const fetchData = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = (supabase
        .from(tableName) as any)
        .select('*', { count: 'exact' })
        .eq('company_id', companyId);

      if (filters.search && searchFieldsRef.current.length > 0) {
        const searchConditions = searchFieldsRef.current
          .map(field => `${field}.ilike.%${filters.search}%`)
          .join(',');
        query = query.or(searchConditions);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.is_active !== undefined && filters.is_active !== 'all') {
        query = query.eq('is_active', filters.is_active === 'true');
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const orderColumn = pagination.orderBy || defaultOrderBy;
      query = query.order(orderColumn, { ascending: pagination.orderDirection === 'asc' });

      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data: result, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setData((result as T[]) || []);
      setTotalCount(count || 0);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`Error fetching ${tableName}:`, err);
      setError(errorMessage);
      toastRef.current({
        title: 'Erro ao carregar dados',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, tableName, pagination, filters, defaultOrderBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(async (item: Record<string, unknown>): Promise<T | null> => {
    if (!companyId) return null;

    try {
      const { data: result, error } = await (supabase
        .from(tableName) as any)
        .insert({ ...item, company_id: companyId })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Registro criado com sucesso!',
      });

      fetchData();
      return result as T;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`Error creating ${tableName}:`, err);
      toast({
        title: 'Erro ao criar',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [companyId, tableName, fetchData, toast]);

  const update = useCallback(async (id: string, item: Record<string, unknown>): Promise<T | null> => {
    try {
      const { data: result, error } = await (supabase
        .from(tableName) as any)
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Registro atualizado com sucesso!',
      });

      fetchData();
      return result as T;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`Error updating ${tableName}:`, err);
      toast({
        title: 'Erro ao atualizar',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [tableName, fetchData, toast]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await (supabase
        .from(tableName) as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Registro excluído com sucesso!',
      });

      fetchData();
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`Error deleting ${tableName}:`, err);
      toast({
        title: 'Erro ao excluir',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [tableName, fetchData, toast]);

  return {
    data,
    loading,
    error,
    totalCount,
    pagination,
    setPagination,
    filters,
    setFilters,
    refresh: fetchData,
    create,
    update,
    remove,
  };
}
