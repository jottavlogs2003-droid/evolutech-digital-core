
-- FIX SECURITY WARNINGS

-- 1. Fix function search_path
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- 2. Fix permissive RLS policies - ensure proper policies
DROP POLICY IF EXISTS "Authenticated can insert logs" ON public.audit_logs;
CREATE POLICY "Users can insert own logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
