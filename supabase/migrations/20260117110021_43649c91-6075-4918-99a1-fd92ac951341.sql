-- Remover a view com SECURITY DEFINER e criar uma versão segura
DROP VIEW IF EXISTS public.payment_gateways_safe;

-- Criar função segura para verificar acesso
CREATE OR REPLACE FUNCTION public.get_payment_gateways_for_user()
RETURNS SETOF public.payment_gateways
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM public.payment_gateways
  WHERE 
    is_evolutech_user(auth.uid())
    OR (
      has_role(auth.uid(), 'dono_empresa'::app_role) 
      AND empresa_id = get_user_company_id(auth.uid())
    );
$$;