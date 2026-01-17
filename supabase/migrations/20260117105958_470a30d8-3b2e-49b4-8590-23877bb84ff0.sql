-- ================================================
-- TABELA: payment_gateways (Gateways de Pagamento por Empresa)
-- ================================================
CREATE TABLE public.payment_gateways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provedor TEXT NOT NULL CHECK (provedor IN ('stripe', 'mercadopago', 'pagseguro', 'asaas', 'pix', 'outro')),
  nome_exibicao TEXT NOT NULL,
  public_key TEXT,
  secret_key_encrypted TEXT, -- Chave criptografada, nunca exposta
  ambiente TEXT NOT NULL DEFAULT 'sandbox' CHECK (ambiente IN ('sandbox', 'producao')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  webhook_url TEXT,
  configuracoes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, provedor)
);

-- Enable RLS
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX idx_payment_gateways_empresa ON public.payment_gateways(empresa_id);
CREATE INDEX idx_payment_gateways_provedor ON public.payment_gateways(provedor);

-- Trigger para updated_at
CREATE TRIGGER update_payment_gateways_updated_at
  BEFORE UPDATE ON public.payment_gateways
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ================================================
-- POLÍTICAS RLS - ISOLAMENTO TOTAL POR EMPRESA
-- ================================================

-- Super Admin Evolutech pode ver e gerenciar TODOS os gateways
CREATE POLICY "Super admin pode gerenciar todos gateways" 
ON public.payment_gateways 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin_evolutech'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin_evolutech'::app_role));

-- Admin Evolutech pode ver todos (não editar)
CREATE POLICY "Admin evolutech pode ver todos gateways" 
ON public.payment_gateways 
FOR SELECT 
USING (has_role(auth.uid(), 'admin_evolutech'::app_role));

-- Dono da empresa pode VER apenas seu gateway (sem ver secret_key)
CREATE POLICY "Dono empresa pode ver seu gateway" 
ON public.payment_gateways 
FOR SELECT 
USING (
  has_role(auth.uid(), 'dono_empresa'::app_role) 
  AND empresa_id = get_user_company_id(auth.uid())
);

-- ================================================
-- VIEW SEGURA: Oculta secret_key para não-admins
-- ================================================
CREATE OR REPLACE VIEW public.payment_gateways_safe AS
SELECT 
  id,
  empresa_id,
  provedor,
  nome_exibicao,
  public_key,
  CASE 
    WHEN is_evolutech_user(auth.uid()) THEN secret_key_encrypted
    ELSE '***HIDDEN***'
  END as secret_key_display,
  ambiente,
  is_active,
  webhook_url,
  configuracoes,
  created_at,
  updated_at
FROM public.payment_gateways;

-- ================================================
-- TABELA: whatsapp_automation_config (Estrutural - DESATIVADO)
-- ================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_automation_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'desativado' CHECK (status IN ('desativado', 'pendente', 'ativo', 'suspenso')),
  eventos_disponiveis JSONB DEFAULT '["agendamento", "confirmacao", "cancelamento", "lembrete", "boas_vindas"]'::jsonb,
  payload_padrao JSONB DEFAULT '{}'::jsonb,
  data_ativacao TIMESTAMP WITH TIME ZONE,
  ativado_por UUID REFERENCES auth.users(id),
  motivo_desativacao TEXT DEFAULT 'Aguardando liberação pela Evolutech',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_automation_config ENABLE ROW LEVEL SECURITY;

-- Índice
CREATE INDEX idx_whatsapp_automation_empresa ON public.whatsapp_automation_config(empresa_id);

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_automation_updated_at
  BEFORE UPDATE ON public.whatsapp_automation_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ================================================
-- POLÍTICAS RLS - WhatsApp Automation
-- ================================================

-- Apenas Evolutech pode gerenciar
CREATE POLICY "Evolutech pode gerenciar whatsapp automation" 
ON public.whatsapp_automation_config 
FOR ALL 
USING (is_evolutech_user(auth.uid()))
WITH CHECK (is_evolutech_user(auth.uid()));

-- Dono empresa pode ver apenas seu config (somente leitura)
CREATE POLICY "Dono empresa pode ver seu whatsapp config" 
ON public.whatsapp_automation_config 
FOR SELECT 
USING (
  has_role(auth.uid(), 'dono_empresa'::app_role) 
  AND empresa_id = get_user_company_id(auth.uid())
);