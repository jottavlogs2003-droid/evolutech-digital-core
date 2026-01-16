-- ============================================
-- WHATSAPP DISPATCH CONTROL TABLE
-- Sistema de orquestração de eventos WhatsApp
-- ============================================

-- Tabela de configuração de webhook por empresa
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    auth_token TEXT,
    timeout_ms INTEGER DEFAULT 30000,
    max_retries INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(empresa_id)
);

-- Tabela de controle de dispatches
CREATE TABLE IF NOT EXISTS public.whatsapp_dispatch (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    usuario_id UUID,
    evento TEXT NOT NULL, -- agendamento, confirmacao, cancelamento, lembrete, etc
    telefone TEXT NOT NULL,
    payload_enviado JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, disparado, erro, timeout
    resposta_webhook JSONB,
    tentativas INTEGER DEFAULT 0,
    erro_mensagem TEXT,
    data_disparo TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_dispatch_empresa ON public.whatsapp_dispatch(empresa_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_dispatch_status ON public.whatsapp_dispatch(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_dispatch_evento ON public.whatsapp_dispatch(evento);
CREATE INDEX IF NOT EXISTS idx_whatsapp_dispatch_created ON public.whatsapp_dispatch(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_empresa ON public.whatsapp_config(empresa_id);

-- Enable RLS
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_dispatch ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_config
CREATE POLICY "Evolutech pode gerenciar todas configs" ON public.whatsapp_config
FOR ALL USING (is_evolutech_user(auth.uid())) WITH CHECK (is_evolutech_user(auth.uid()));

CREATE POLICY "Dono empresa pode ver sua config" ON public.whatsapp_config
FOR SELECT USING (
    has_role(auth.uid(), 'dono_empresa'::app_role) 
    AND empresa_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Dono empresa pode atualizar sua config" ON public.whatsapp_config
FOR UPDATE USING (
    has_role(auth.uid(), 'dono_empresa'::app_role) 
    AND empresa_id = get_user_company_id(auth.uid())
) WITH CHECK (
    has_role(auth.uid(), 'dono_empresa'::app_role) 
    AND empresa_id = get_user_company_id(auth.uid())
);

-- RLS Policies for whatsapp_dispatch
CREATE POLICY "Evolutech pode ver todos dispatches" ON public.whatsapp_dispatch
FOR SELECT USING (is_evolutech_user(auth.uid()));

CREATE POLICY "Empresa pode ver seus dispatches" ON public.whatsapp_dispatch
FOR SELECT USING (can_access_company(auth.uid(), empresa_id));

CREATE POLICY "Sistema pode inserir dispatches" ON public.whatsapp_dispatch
FOR INSERT WITH CHECK (can_access_company(auth.uid(), empresa_id));

CREATE POLICY "Evolutech pode gerenciar dispatches" ON public.whatsapp_dispatch
FOR ALL USING (is_evolutech_user(auth.uid())) WITH CHECK (is_evolutech_user(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_config_updated_at
    BEFORE UPDATE ON public.whatsapp_config
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_whatsapp_dispatch_updated_at
    BEFORE UPDATE ON public.whatsapp_dispatch
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();