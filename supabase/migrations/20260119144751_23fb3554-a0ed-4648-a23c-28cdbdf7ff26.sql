-- First create the function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for company chatbots configuration
CREATE TABLE public.company_chatbots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  chatbot_type TEXT NOT NULL DEFAULT 'ai' CHECK (chatbot_type IN ('ai', 'external')),
  name TEXT NOT NULL DEFAULT 'Assistente Virtual',
  is_active BOOLEAN NOT NULL DEFAULT false,
  slug TEXT UNIQUE,
  welcome_message TEXT DEFAULT 'Olá! Como posso ajudar você hoje?',
  system_prompt TEXT DEFAULT 'Você é um assistente virtual prestativo e profissional. Responda de forma clara e concisa.',
  external_webhook_url TEXT,
  external_api_key TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index for company + type combination
CREATE UNIQUE INDEX idx_company_chatbot_type ON public.company_chatbots(company_id, chatbot_type);

-- Enable RLS
ALTER TABLE public.company_chatbots ENABLE ROW LEVEL SECURITY;

-- Evolutech admins can manage all chatbots
CREATE POLICY "Evolutech admins can manage all chatbots"
ON public.company_chatbots
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin_evolutech', 'admin_evolutech')
  )
);

-- Company owners can view and update their own chatbots
CREATE POLICY "Company owners can manage their chatbots"
ON public.company_chatbots
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.company_id = company_chatbots.company_id
    AND ur.role = 'dono_empresa'
  )
);

-- Public read access for active chatbots (for the public chat page)
CREATE POLICY "Public can view active chatbots by slug"
ON public.company_chatbots
FOR SELECT
USING (is_active = true AND slug IS NOT NULL);

-- Create table for chat conversations
CREATE TABLE public.chatbot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID NOT NULL REFERENCES public.company_chatbots(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Admins can view conversations
CREATE POLICY "Admins can view conversations"
ON public.chatbot_conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_chatbots cb
    JOIN public.user_roles ur ON (
      ur.user_id = auth.uid() AND (
        ur.role IN ('super_admin_evolutech', 'admin_evolutech')
        OR (ur.role = 'dono_empresa' AND ur.company_id = cb.company_id)
      )
    )
    WHERE cb.id = chatbot_conversations.chatbot_id
  )
);

-- Public can create conversations
CREATE POLICY "Public can create conversations"
ON public.chatbot_conversations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_chatbots cb
    WHERE cb.id = chatbot_conversations.chatbot_id
    AND cb.is_active = true
  )
);

-- Create table for chat messages
CREATE TABLE public.chatbot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Admins can view messages
CREATE POLICY "Admins can view messages"
ON public.chatbot_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chatbot_conversations cc
    JOIN public.company_chatbots cb ON cb.id = cc.chatbot_id
    JOIN public.user_roles ur ON (
      ur.user_id = auth.uid() AND (
        ur.role IN ('super_admin_evolutech', 'admin_evolutech')
        OR (ur.role = 'dono_empresa' AND ur.company_id = cb.company_id)
      )
    )
    WHERE cc.id = chatbot_messages.conversation_id
  )
);

-- Public can create messages
CREATE POLICY "Public can create messages"
ON public.chatbot_messages
FOR INSERT
WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_company_chatbots_updated_at
BEFORE UPDATE ON public.company_chatbots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chatbot_conversations_updated_at
BEFORE UPDATE ON public.chatbot_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();