
-- Allow company owners to manage their own empresa_modulos
CREATE POLICY "Dono empresa pode inserir módulos"
ON public.empresa_modulos
FOR INSERT
TO authenticated
WITH CHECK (
  is_company_owner(auth.uid(), empresa_id)
);

CREATE POLICY "Dono empresa pode atualizar módulos"
ON public.empresa_modulos
FOR UPDATE
TO authenticated
USING (is_company_owner(auth.uid(), empresa_id))
WITH CHECK (is_company_owner(auth.uid(), empresa_id));

CREATE POLICY "Dono empresa pode deletar módulos"
ON public.empresa_modulos
FOR DELETE
TO authenticated
USING (is_company_owner(auth.uid(), empresa_id));
