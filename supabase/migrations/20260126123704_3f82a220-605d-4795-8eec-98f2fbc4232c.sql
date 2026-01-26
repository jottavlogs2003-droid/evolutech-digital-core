-- 1. Adicionar coluna 'porte' aos sistemas_base para suportar P/M/G
ALTER TABLE sistemas_base ADD COLUMN IF NOT EXISTS porte TEXT DEFAULT 'medio';

-- 2. Inserir módulos padronizados (core e opcionais) com UPSERT
INSERT INTO modulos (codigo, nome, descricao, icone, is_core, preco_mensal, status) VALUES
  -- Módulos Core (obrigatórios)
  ('dashboard', 'Dashboard', 'Painel principal com métricas', 'LayoutDashboard', true, 0, 'active'),
  ('users', 'Usuários', 'Gestão de equipe e permissões', 'Users', true, 0, 'active'),
  ('settings', 'Configurações', 'Configurações do sistema', 'Settings', true, 0, 'active'),
  
  -- Módulos de Negócio
  ('customers', 'Clientes', 'Cadastro e gestão de clientes', 'UserPlus', false, 29.90, 'active'),
  ('appointments', 'Agendamentos', 'Sistema de agendamentos', 'Calendar', false, 49.90, 'active'),
  ('products', 'Produtos', 'Catálogo de produtos', 'Package', false, 39.90, 'active'),
  ('inventory', 'Estoque', 'Controle de estoque', 'Warehouse', false, 49.90, 'active'),
  ('orders', 'Pedidos', 'Gestão de pedidos e vendas', 'ShoppingCart', false, 59.90, 'active'),
  ('cash', 'Caixa', 'Controle de caixa diário', 'Wallet', false, 39.90, 'active'),
  ('finance', 'Financeiro', 'Contas a pagar e receber', 'CreditCard', false, 69.90, 'active'),
  ('reports', 'Relatórios', 'Relatórios gerenciais', 'BarChart', false, 49.90, 'active'),
  ('support', 'Suporte', 'Tickets de suporte', 'HeadphonesIcon', false, 0, 'active'),
  ('training', 'Treinamentos', 'Material de treinamento', 'GraduationCap', false, 0, 'active'),
  
  -- Módulos Específicos por Nicho
  ('pos', 'PDV', 'Ponto de venda completo', 'Monitor', false, 99.90, 'active'),
  ('menu', 'Cardápio', 'Cardápio digital', 'Menu', false, 39.90, 'active'),
  ('delivery', 'Delivery', 'Gestão de entregas', 'Truck', false, 59.90, 'active'),
  ('patients', 'Pacientes', 'Prontuário e histórico', 'Stethoscope', false, 49.90, 'active'),
  ('medical_records', 'Prontuário', 'Prontuário eletrônico', 'FileText', false, 59.90, 'active'),
  ('prescriptions', 'Receitas', 'Emissão de receitas', 'Pill', false, 39.90, 'active'),
  ('students', 'Alunos', 'Gestão de alunos', 'GraduationCap', false, 39.90, 'active'),
  ('classes', 'Turmas', 'Gestão de turmas e horários', 'Users', false, 49.90, 'active'),
  ('enrollments', 'Matrículas', 'Sistema de matrículas', 'ClipboardCheck', false, 59.90, 'active'),
  ('workouts', 'Treinos', 'Fichas de treino', 'Dumbbell', false, 49.90, 'active'),
  ('assessments', 'Avaliações', 'Avaliação física', 'Activity', false, 39.90, 'active'),
  ('subscriptions', 'Assinaturas', 'Planos e mensalidades', 'CreditCard', false, 59.90, 'active'),
  ('properties', 'Imóveis', 'Cadastro de imóveis', 'Home', false, 59.90, 'active'),
  ('contracts', 'Contratos', 'Gestão de contratos', 'FileText', false, 69.90, 'active'),
  ('suppliers', 'Fornecedores', 'Cadastro de fornecedores', 'Factory', false, 29.90, 'active'),
  ('purchases', 'Compras', 'Pedidos de compra', 'ShoppingBag', false, 49.90, 'active'),
  ('services', 'Serviços', 'Catálogo de serviços', 'Wrench', false, 39.90, 'active'),
  ('vehicles', 'Veículos', 'Cadastro de veículos', 'Car', false, 39.90, 'active'),
  ('audit', 'Auditoria', 'Logs do sistema', 'Shield', false, 49.90, 'active'),
  ('notifications', 'Notificações', 'Sistema de alertas', 'Bell', false, 29.90, 'active'),
  ('app', 'Aplicativo', 'App mobile/PWA', 'Smartphone', false, 99.90, 'active'),
  ('whatsapp', 'WhatsApp', 'Integração WhatsApp', 'MessageCircle', false, 79.90, 'active'),
  ('promotions', 'Promoções', 'Gestão de promoções e descontos', 'Tag', false, 39.90, 'active'),
  ('loyalty', 'Fidelidade', 'Programa de fidelidade', 'Gift', false, 49.90, 'active'),
  ('reviews', 'Avaliações de Clientes', 'Sistema de avaliações', 'Star', false, 29.90, 'active')
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icone = EXCLUDED.icone,
  is_core = EXCLUDED.is_core,
  preco_mensal = EXCLUDED.preco_mensal;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_empresa_modulos_empresa_ativo ON empresa_modulos(empresa_id, ativo);
CREATE INDEX IF NOT EXISTS idx_sistema_base_modulos_sistema ON sistema_base_modulos(sistema_base_id);