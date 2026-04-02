
-- Custom Modules system for dynamic module creation by clients
CREATE TABLE public.custom_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT DEFAULT 'Box',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.custom_modules(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'text',
  opcoes JSONB,
  obrigatorio BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.custom_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.custom_modules(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  dados JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Projects & Tasks table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  prioridade TEXT DEFAULT 'media',
  responsavel_id UUID REFERENCES auth.users(id),
  prazo DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'documento',
  file_url TEXT,
  file_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  titulo TEXT NOT NULL,
  mensagem TEXT,
  tipo TEXT DEFAULT 'info',
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.custom_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS: custom_modules
CREATE POLICY "Company users can view custom modules" ON public.custom_modules FOR SELECT USING (can_access_company(auth.uid(), empresa_id));
CREATE POLICY "Company owners can manage custom modules" ON public.custom_modules FOR ALL USING (is_company_owner(auth.uid(), empresa_id)) WITH CHECK (is_company_owner(auth.uid(), empresa_id));
CREATE POLICY "Evolutech can manage all custom modules" ON public.custom_modules FOR ALL USING (is_evolutech_user(auth.uid())) WITH CHECK (is_evolutech_user(auth.uid()));

-- RLS: custom_fields
CREATE POLICY "Users can view fields of accessible modules" ON public.custom_fields FOR SELECT USING (EXISTS (SELECT 1 FROM public.custom_modules cm WHERE cm.id = module_id AND can_access_company(auth.uid(), cm.empresa_id)));
CREATE POLICY "Owners can manage fields" ON public.custom_fields FOR ALL USING (EXISTS (SELECT 1 FROM public.custom_modules cm WHERE cm.id = module_id AND is_company_owner(auth.uid(), cm.empresa_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.custom_modules cm WHERE cm.id = module_id AND is_company_owner(auth.uid(), cm.empresa_id)));
CREATE POLICY "Evolutech can manage all fields" ON public.custom_fields FOR ALL USING (is_evolutech_user(auth.uid())) WITH CHECK (is_evolutech_user(auth.uid()));

-- RLS: custom_records
CREATE POLICY "Company users can view custom records" ON public.custom_records FOR SELECT USING (can_access_company(auth.uid(), empresa_id));
CREATE POLICY "Company users can insert custom records" ON public.custom_records FOR INSERT WITH CHECK (can_access_company(auth.uid(), empresa_id));
CREATE POLICY "Company users can update custom records" ON public.custom_records FOR UPDATE USING (can_access_company(auth.uid(), empresa_id));
CREATE POLICY "Company owners can delete custom records" ON public.custom_records FOR DELETE USING (is_company_owner(auth.uid(), empresa_id));
CREATE POLICY "Evolutech can manage all custom records" ON public.custom_records FOR ALL USING (is_evolutech_user(auth.uid())) WITH CHECK (is_evolutech_user(auth.uid()));

-- RLS: projects
CREATE POLICY "Company users can view projects" ON public.projects FOR SELECT USING (can_access_company(auth.uid(), company_id));
CREATE POLICY "Company users can insert projects" ON public.projects FOR INSERT WITH CHECK (can_access_company(auth.uid(), company_id));
CREATE POLICY "Company users can update projects" ON public.projects FOR UPDATE USING (can_access_company(auth.uid(), company_id));
CREATE POLICY "Company owners can delete projects" ON public.projects FOR DELETE USING (is_company_owner(auth.uid(), company_id));

-- RLS: tasks
CREATE POLICY "Company users can view tasks" ON public.tasks FOR SELECT USING (can_access_company(auth.uid(), company_id));
CREATE POLICY "Company users can insert tasks" ON public.tasks FOR INSERT WITH CHECK (can_access_company(auth.uid(), company_id));
CREATE POLICY "Company users can update tasks" ON public.tasks FOR UPDATE USING (can_access_company(auth.uid(), company_id));
CREATE POLICY "Company owners can delete tasks" ON public.tasks FOR DELETE USING (is_company_owner(auth.uid(), company_id));

-- RLS: documents
CREATE POLICY "Company users can view documents" ON public.documents FOR SELECT USING (can_access_company(auth.uid(), company_id));
CREATE POLICY "Company users can insert documents" ON public.documents FOR INSERT WITH CHECK (can_access_company(auth.uid(), company_id));
CREATE POLICY "Company users can update documents" ON public.documents FOR UPDATE USING (can_access_company(auth.uid(), company_id));
CREATE POLICY "Company owners can delete documents" ON public.documents FOR DELETE USING (is_company_owner(auth.uid(), company_id));

-- RLS: notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Company users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (can_access_company(auth.uid(), company_id));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_custom_modules_updated_at BEFORE UPDATE ON public.custom_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_custom_records_updated_at BEFORE UPDATE ON public.custom_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('company-documents', 'company-documents', false);
CREATE POLICY "Company users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Company users can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'company-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Company users can delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'company-documents' AND auth.role() = 'authenticated');
