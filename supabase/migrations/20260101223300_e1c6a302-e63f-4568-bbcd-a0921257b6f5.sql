-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true);

-- Create storage policies for company logos
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "Evolutech can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND public.is_evolutech_user(auth.uid())
);

CREATE POLICY "Evolutech can update company logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos' 
  AND public.is_evolutech_user(auth.uid())
);

CREATE POLICY "Evolutech can delete company logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos' 
  AND public.is_evolutech_user(auth.uid())
);

-- Add obrigatorio field to empresa_modulos
ALTER TABLE public.empresa_modulos 
ADD COLUMN IF NOT EXISTS obrigatorio boolean DEFAULT false;

-- Add sistema_base_id to companies if not exists
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS sistema_base_id uuid REFERENCES public.sistemas_base(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_empresa_modulos_empresa_id ON public.empresa_modulos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresa_modulos_modulo_id ON public.empresa_modulos(modulo_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON public.user_roles(company_id);