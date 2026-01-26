-- ===================================================
-- CRIAR TABELAS CRUD PARA MÓDULOS DA EMPRESA
-- ===================================================

-- 1. CLIENTES (customers)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT, -- CPF/CNPJ
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company users can view own customers"
  ON public.customers FOR SELECT
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company users can insert customers"
  ON public.customers FOR INSERT
  WITH CHECK (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company users can update own customers"
  ON public.customers FOR UPDATE
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company admins can delete customers"
  ON public.customers FOR DELETE
  USING (is_company_owner(auth.uid(), company_id));

-- Trigger for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. CATEGORIAS DE PRODUTOS (product_categories)
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_company ON public.product_categories(company_id);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view own categories"
  ON public.product_categories FOR SELECT
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company admins can manage categories"
  ON public.product_categories FOR ALL
  USING (is_company_owner(auth.uid(), company_id));

CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. PRODUTOS (products)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  cost_price NUMERIC(12,2) DEFAULT 0,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'un', -- un, kg, lt, etc
  stock_quantity NUMERIC(12,3) DEFAULT 0,
  min_stock NUMERIC(12,3) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view own products"
  ON public.products FOR SELECT
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company users can insert products"
  ON public.products FOR INSERT
  WITH CHECK (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company users can update own products"
  ON public.products FOR UPDATE
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company admins can delete products"
  ON public.products FOR DELETE
  USING (is_company_owner(auth.uid(), company_id));

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. MOVIMENTAÇÃO DE ESTOQUE (stock_movements)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'entrada', 'saida', 'ajuste'
  quantity NUMERIC(12,3) NOT NULL,
  unit_cost NUMERIC(12,2),
  notes TEXT,
  reference_type TEXT, -- 'order', 'manual', 'purchase'
  reference_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_company ON public.stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(type);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view stock movements"
  ON public.stock_movements FOR SELECT
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company users can create stock movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (can_access_company(auth.uid(), company_id));

-- 5. AGENDAMENTOS (appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT,
  customer_phone TEXT,
  service_name TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, confirmado, cancelado, concluido
  notes TEXT,
  price NUMERIC(12,2),
  assigned_to UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_company ON public.appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view own appointments"
  ON public.appointments FOR SELECT
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company users can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company users can update own appointments"
  ON public.appointments FOR UPDATE
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company admins can delete appointments"
  ON public.appointments FOR DELETE
  USING (is_company_owner(auth.uid(), company_id));

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. PEDIDOS/VENDAS (orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT,
  order_number SERIAL,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, em_preparo, pronto, entregue, cancelado
  payment_status TEXT DEFAULT 'pendente', -- pendente, pago, parcial
  payment_method TEXT, -- dinheiro, cartao, pix
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_company ON public.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view own orders"
  ON public.orders FOR SELECT
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company users can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company users can update own orders"
  ON public.orders FOR UPDATE
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company admins can delete orders"
  ON public.orders FOR DELETE
  USING (is_company_owner(auth.uid(), company_id));

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. ITENS DO PEDIDO (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order items via orders"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND can_access_company(auth.uid(), o.company_id)
  ));

CREATE POLICY "Users can manage order items via orders"
  ON public.order_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND can_access_company(auth.uid(), o.company_id)
  ));

-- 8. CAIXA / FINANCEIRO (cash_transactions)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'entrada', 'saida'
  category TEXT, -- vendas, servicos, despesas, retirada, etc
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT, -- dinheiro, cartao, pix, boleto
  reference_type TEXT, -- order, appointment, manual
  reference_id UUID,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_company ON public.cash_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON public.cash_transactions(type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON public.cash_transactions(transaction_date);

ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view cash transactions"
  ON public.cash_transactions FOR SELECT
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company users can insert cash transactions"
  ON public.cash_transactions FOR INSERT
  WITH CHECK (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company admins can manage cash transactions"
  ON public.cash_transactions FOR UPDATE
  USING (is_company_owner(auth.uid(), company_id));

CREATE POLICY "Company admins can delete cash transactions"
  ON public.cash_transactions FOR DELETE
  USING (is_company_owner(auth.uid(), company_id));

-- 9. CONTAS A PAGAR/RECEBER (accounts_payable_receivable)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'pagar', 'receber'
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, pago, vencido, cancelado
  payment_date DATE,
  customer_id UUID REFERENCES public.customers(id),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_company ON public.accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON public.accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_due_date ON public.accounts(due_date);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view accounts"
  ON public.accounts FOR SELECT
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company users can insert accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company users can update accounts"
  ON public.accounts FOR UPDATE
  USING (can_access_company(auth.uid(), company_id));

CREATE POLICY "Company admins can delete accounts"
  ON public.accounts FOR DELETE
  USING (is_company_owner(auth.uid(), company_id));

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();