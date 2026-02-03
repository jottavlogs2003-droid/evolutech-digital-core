-- Create company_themes table for white-label customization
CREATE TABLE public.company_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Logo and branding
  logo_path TEXT,
  favicon_path TEXT,
  login_cover_path TEXT,
  company_display_name TEXT,
  
  -- Colors (stored as HSL values for CSS variables)
  primary_color TEXT DEFAULT '217 91% 60%',
  primary_foreground TEXT DEFAULT '222 47% 6%',
  secondary_color TEXT DEFAULT '217 33% 17%',
  secondary_foreground TEXT DEFAULT '210 40% 98%',
  accent_color TEXT DEFAULT '187 85% 53%',
  accent_foreground TEXT DEFAULT '222 47% 6%',
  background_color TEXT DEFAULT '222 47% 6%',
  foreground_color TEXT DEFAULT '210 40% 98%',
  card_color TEXT DEFAULT '222 47% 8%',
  card_foreground TEXT DEFAULT '210 40% 98%',
  muted_color TEXT DEFAULT '217 33% 12%',
  muted_foreground TEXT DEFAULT '215 20% 55%',
  border_color TEXT DEFAULT '217 33% 17%',
  destructive_color TEXT DEFAULT '0 84% 60%',
  
  -- Sidebar colors
  sidebar_background TEXT DEFAULT '222 47% 7%',
  sidebar_foreground TEXT DEFAULT '210 40% 98%',
  sidebar_primary TEXT DEFAULT '217 91% 60%',
  sidebar_accent TEXT DEFAULT '217 33% 17%',
  
  -- UI customization
  border_radius TEXT DEFAULT '0.75rem',
  font_family TEXT DEFAULT 'Inter',
  
  -- Dark mode preference
  dark_mode_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_company_themes_company_id ON public.company_themes(company_id);

-- Enable RLS
ALTER TABLE public.company_themes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Evolutech can manage all themes
CREATE POLICY "Evolutech pode gerenciar todos temas"
  ON public.company_themes
  FOR ALL
  USING (is_evolutech_user(auth.uid()))
  WITH CHECK (is_evolutech_user(auth.uid()));

-- Company owner can view and update their theme
CREATE POLICY "Dono empresa pode ver seu tema"
  ON public.company_themes
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Dono empresa pode atualizar seu tema"
  ON public.company_themes
  FOR UPDATE
  USING (is_company_owner(auth.uid(), company_id))
  WITH CHECK (is_company_owner(auth.uid(), company_id));

-- Company employees can view theme (needed for rendering)
CREATE POLICY "Funcionarios podem ver tema da empresa"
  ON public.company_themes
  FOR SELECT
  USING (can_access_company(auth.uid(), company_id));

-- Trigger for updated_at
CREATE TRIGGER update_company_themes_updated_at
  BEFORE UPDATE ON public.company_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();