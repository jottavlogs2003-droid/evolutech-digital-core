CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'super_admin_evolutech',
    'admin_evolutech',
    'dono_empresa',
    'funcionario_empresa'
);


--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_action AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'activate',
    'deactivate',
    'invite',
    'role_change'
);


--
-- Name: entity_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.entity_status AS ENUM (
    'active',
    'inactive',
    'pending'
);


--
-- Name: plan_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.plan_type AS ENUM (
    'starter',
    'professional',
    'enterprise'
);


--
-- Name: can_access_company(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_company(_user_id uuid, _company_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role IN ('super_admin_evolutech', 'admin_evolutech')
        OR company_id = _company_id
      )
  )
$$;


--
-- Name: get_user_company_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_company_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT company_id
  FROM public.user_roles
  WHERE user_id = _user_id
    AND company_id IS NOT NULL
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_company_owner(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_company_owner(_user_id uuid, _empresa_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'dono_empresa'
      AND company_id = _empresa_id
  )
$$;


--
-- Name: is_evolutech_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_evolutech_user(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin_evolutech', 'admin_evolutech')
  )
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    user_email text,
    action public.audit_action NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    company_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    plan public.plan_type DEFAULT 'starter'::public.plan_type NOT NULL,
    status public.entity_status DEFAULT 'active'::public.entity_status NOT NULL,
    monthly_revenue numeric(12,2) DEFAULT 0,
    logo_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: empresa_modulos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresa_modulos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    modulo_id uuid NOT NULL,
    ativo boolean DEFAULT true,
    data_ativacao timestamp with time zone DEFAULT now(),
    data_desativacao timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: evolucoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evolucoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sistema_base_id uuid,
    empresa_id uuid,
    titulo text NOT NULL,
    descricao text NOT NULL,
    tipo text DEFAULT 'melhoria'::text,
    status text DEFAULT 'pendente'::text,
    prioridade text DEFAULT 'media'::text,
    solicitado_por uuid,
    desenvolvedor_responsavel uuid,
    versao_alvo text,
    data_inicio timestamp with time zone,
    data_conclusao timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT evolucoes_prioridade_check CHECK ((prioridade = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text]))),
    CONSTRAINT evolucoes_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'em_desenvolvimento'::text, 'em_teste'::text, 'concluido'::text, 'cancelado'::text]))),
    CONSTRAINT evolucoes_tipo_check CHECK ((tipo = ANY (ARRAY['melhoria'::text, 'correcao'::text, 'nova_funcionalidade'::text, 'customizacao'::text])))
);


--
-- Name: financial_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    month date NOT NULL,
    revenue numeric(12,2) DEFAULT 0,
    mrr numeric(12,2) DEFAULT 0,
    churn_rate numeric(5,2) DEFAULT 0,
    new_customers integer DEFAULT 0,
    active_users integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    role public.app_role NOT NULL,
    company_id uuid,
    invited_by uuid NOT NULL,
    token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text) NOT NULL,
    status public.entity_status DEFAULT 'pending'::public.entity_status NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: modulos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modulos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    codigo text NOT NULL,
    icone text,
    preco_mensal numeric DEFAULT 0,
    is_core boolean DEFAULT false,
    status public.entity_status DEFAULT 'active'::public.entity_status,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sistema_base_modulos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sistema_base_modulos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sistema_base_id uuid NOT NULL,
    modulo_id uuid NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sistemas_base; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sistemas_base (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    nicho text NOT NULL,
    versao text DEFAULT '1.0.0'::text,
    status public.entity_status DEFAULT 'active'::public.entity_status,
    configuracoes jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sistemas_clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sistemas_clientes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    sistema_base_id uuid NOT NULL,
    nome_customizado text,
    configuracoes jsonb DEFAULT '{}'::jsonb,
    status public.entity_status DEFAULT 'active'::public.entity_status,
    data_ativacao timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tickets_suporte; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets_suporte (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    titulo text NOT NULL,
    descricao text NOT NULL,
    prioridade text DEFAULT 'media'::text,
    status text DEFAULT 'aberto'::text,
    categoria text,
    atribuido_para uuid,
    resposta text,
    data_resolucao timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tickets_suporte_prioridade_check CHECK ((prioridade = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'urgente'::text]))),
    CONSTRAINT tickets_suporte_status_check CHECK ((status = ANY (ARRAY['aberto'::text, 'em_andamento'::text, 'aguardando_cliente'::text, 'resolvido'::text, 'fechado'::text])))
);


--
-- Name: treinamento_progresso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treinamento_progresso (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    treinamento_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    empresa_id uuid NOT NULL,
    concluido boolean DEFAULT false,
    progresso_percentual integer DEFAULT 0,
    data_inicio timestamp with time zone DEFAULT now(),
    data_conclusao timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: treinamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treinamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid,
    titulo text NOT NULL,
    descricao text,
    tipo text DEFAULT 'video'::text,
    url_conteudo text,
    duracao_minutos integer,
    modulo_id uuid,
    is_publico boolean DEFAULT false,
    ordem integer DEFAULT 0,
    status public.entity_status DEFAULT 'active'::public.entity_status,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT treinamentos_tipo_check CHECK ((tipo = ANY (ARRAY['video'::text, 'documento'::text, 'webinar'::text, 'presencial'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    company_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: companies companies_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_slug_key UNIQUE (slug);


--
-- Name: empresa_modulos empresa_modulos_empresa_id_modulo_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa_modulos
    ADD CONSTRAINT empresa_modulos_empresa_id_modulo_id_key UNIQUE (empresa_id, modulo_id);


--
-- Name: empresa_modulos empresa_modulos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa_modulos
    ADD CONSTRAINT empresa_modulos_pkey PRIMARY KEY (id);


--
-- Name: evolucoes evolucoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evolucoes
    ADD CONSTRAINT evolucoes_pkey PRIMARY KEY (id);


--
-- Name: financial_metrics financial_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_metrics
    ADD CONSTRAINT financial_metrics_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_token_key UNIQUE (token);


--
-- Name: modulos modulos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modulos
    ADD CONSTRAINT modulos_codigo_key UNIQUE (codigo);


--
-- Name: modulos modulos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modulos
    ADD CONSTRAINT modulos_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: sistema_base_modulos sistema_base_modulos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sistema_base_modulos
    ADD CONSTRAINT sistema_base_modulos_pkey PRIMARY KEY (id);


--
-- Name: sistema_base_modulos sistema_base_modulos_sistema_base_id_modulo_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sistema_base_modulos
    ADD CONSTRAINT sistema_base_modulos_sistema_base_id_modulo_id_key UNIQUE (sistema_base_id, modulo_id);


--
-- Name: sistemas_base sistemas_base_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sistemas_base
    ADD CONSTRAINT sistemas_base_pkey PRIMARY KEY (id);


--
-- Name: sistemas_clientes sistemas_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sistemas_clientes
    ADD CONSTRAINT sistemas_clientes_pkey PRIMARY KEY (id);


--
-- Name: tickets_suporte tickets_suporte_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets_suporte
    ADD CONSTRAINT tickets_suporte_pkey PRIMARY KEY (id);


--
-- Name: treinamento_progresso treinamento_progresso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treinamento_progresso
    ADD CONSTRAINT treinamento_progresso_pkey PRIMARY KEY (id);


--
-- Name: treinamento_progresso treinamento_progresso_treinamento_id_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treinamento_progresso
    ADD CONSTRAINT treinamento_progresso_treinamento_id_usuario_id_key UNIQUE (treinamento_id, usuario_id);


--
-- Name: treinamentos treinamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treinamentos
    ADD CONSTRAINT treinamentos_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_company_id_key UNIQUE (user_id, role, company_id);


--
-- Name: idx_audit_logs_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_company_id ON public.audit_logs USING btree (company_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_financial_metrics_company_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_metrics_company_month ON public.financial_metrics USING btree (company_id, month);


--
-- Name: idx_invitations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_email ON public.invitations USING btree (email);


--
-- Name: idx_invitations_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_token ON public.invitations USING btree (token);


--
-- Name: idx_user_roles_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_company_id ON public.user_roles USING btree (company_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: companies update_companies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: empresa_modulos update_empresa_modulos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_empresa_modulos_updated_at BEFORE UPDATE ON public.empresa_modulos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: evolucoes update_evolucoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_evolucoes_updated_at BEFORE UPDATE ON public.evolucoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: modulos update_modulos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_modulos_updated_at BEFORE UPDATE ON public.modulos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: sistemas_base update_sistemas_base_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sistemas_base_updated_at BEFORE UPDATE ON public.sistemas_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: sistemas_clientes update_sistemas_clientes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sistemas_clientes_updated_at BEFORE UPDATE ON public.sistemas_clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: tickets_suporte update_tickets_suporte_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tickets_suporte_updated_at BEFORE UPDATE ON public.tickets_suporte FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: treinamento_progresso update_treinamento_progresso_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_treinamento_progresso_updated_at BEFORE UPDATE ON public.treinamento_progresso FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: treinamentos update_treinamentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_treinamentos_updated_at BEFORE UPDATE ON public.treinamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: audit_logs audit_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: empresa_modulos empresa_modulos_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa_modulos
    ADD CONSTRAINT empresa_modulos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: empresa_modulos empresa_modulos_modulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa_modulos
    ADD CONSTRAINT empresa_modulos_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES public.modulos(id) ON DELETE CASCADE;


--
-- Name: evolucoes evolucoes_desenvolvedor_responsavel_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evolucoes
    ADD CONSTRAINT evolucoes_desenvolvedor_responsavel_fkey FOREIGN KEY (desenvolvedor_responsavel) REFERENCES auth.users(id);


--
-- Name: evolucoes evolucoes_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evolucoes
    ADD CONSTRAINT evolucoes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: evolucoes evolucoes_sistema_base_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evolucoes
    ADD CONSTRAINT evolucoes_sistema_base_id_fkey FOREIGN KEY (sistema_base_id) REFERENCES public.sistemas_base(id);


--
-- Name: evolucoes evolucoes_solicitado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evolucoes
    ADD CONSTRAINT evolucoes_solicitado_por_fkey FOREIGN KEY (solicitado_por) REFERENCES auth.users(id);


--
-- Name: financial_metrics financial_metrics_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_metrics
    ADD CONSTRAINT financial_metrics_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: invitations invitations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: invitations invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sistema_base_modulos sistema_base_modulos_modulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sistema_base_modulos
    ADD CONSTRAINT sistema_base_modulos_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES public.modulos(id) ON DELETE CASCADE;


--
-- Name: sistema_base_modulos sistema_base_modulos_sistema_base_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sistema_base_modulos
    ADD CONSTRAINT sistema_base_modulos_sistema_base_id_fkey FOREIGN KEY (sistema_base_id) REFERENCES public.sistemas_base(id) ON DELETE CASCADE;


--
-- Name: sistemas_clientes sistemas_clientes_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sistemas_clientes
    ADD CONSTRAINT sistemas_clientes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: sistemas_clientes sistemas_clientes_sistema_base_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sistemas_clientes
    ADD CONSTRAINT sistemas_clientes_sistema_base_id_fkey FOREIGN KEY (sistema_base_id) REFERENCES public.sistemas_base(id);


--
-- Name: tickets_suporte tickets_suporte_atribuido_para_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets_suporte
    ADD CONSTRAINT tickets_suporte_atribuido_para_fkey FOREIGN KEY (atribuido_para) REFERENCES auth.users(id);


--
-- Name: tickets_suporte tickets_suporte_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets_suporte
    ADD CONSTRAINT tickets_suporte_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: tickets_suporte tickets_suporte_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets_suporte
    ADD CONSTRAINT tickets_suporte_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id);


--
-- Name: treinamento_progresso treinamento_progresso_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treinamento_progresso
    ADD CONSTRAINT treinamento_progresso_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: treinamento_progresso treinamento_progresso_treinamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treinamento_progresso
    ADD CONSTRAINT treinamento_progresso_treinamento_id_fkey FOREIGN KEY (treinamento_id) REFERENCES public.treinamentos(id) ON DELETE CASCADE;


--
-- Name: treinamento_progresso treinamento_progresso_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treinamento_progresso
    ADD CONSTRAINT treinamento_progresso_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id);


--
-- Name: treinamentos treinamentos_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treinamentos
    ADD CONSTRAINT treinamentos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: treinamentos treinamentos_modulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treinamentos
    ADD CONSTRAINT treinamentos_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES public.modulos(id);


--
-- Name: user_roles user_roles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs Admin evolutech can view logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin evolutech can view logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin_evolutech'::public.app_role));


--
-- Name: invitations Anyone can view invitation by token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view invitation by token" ON public.invitations FOR SELECT TO authenticated, anon USING (((status = 'pending'::public.entity_status) AND (expires_at > now())));


--
-- Name: audit_logs Authenticated can insert logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can insert logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: modulos Clientes podem ver módulos ativos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes podem ver módulos ativos" ON public.modulos FOR SELECT USING ((status = 'active'::public.entity_status));


--
-- Name: invitations Company admins can manage company invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can manage company invitations" ON public.invitations TO authenticated USING ((public.has_role(auth.uid(), 'dono_empresa'::public.app_role) AND (company_id = public.get_user_company_id(auth.uid())))) WITH CHECK ((public.has_role(auth.uid(), 'dono_empresa'::public.app_role) AND (company_id = public.get_user_company_id(auth.uid()))));


--
-- Name: user_roles Company admins can manage company roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can manage company roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'dono_empresa'::public.app_role) AND (company_id = public.get_user_company_id(auth.uid())) AND (role = ANY (ARRAY['dono_empresa'::public.app_role, 'funcionario_empresa'::public.app_role]))));


--
-- Name: audit_logs Company admins can view company logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can view company logs" ON public.audit_logs FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'dono_empresa'::public.app_role) AND (company_id = public.get_user_company_id(auth.uid()))));


--
-- Name: profiles Company admins can view company profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can view company profiles" ON public.profiles FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles ur1
  WHERE ((ur1.user_id = auth.uid()) AND (ur1.role = 'dono_empresa'::public.app_role) AND (ur1.company_id IN ( SELECT ur2.company_id
           FROM public.user_roles ur2
          WHERE (ur2.user_id = profiles.id)))))));


--
-- Name: user_roles Company admins can view company roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can view company roles" ON public.user_roles FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'dono_empresa'::public.app_role) AND (company_id = public.get_user_company_id(auth.uid()))));


--
-- Name: evolucoes Dono empresa pode solicitar evolucoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Dono empresa pode solicitar evolucoes" ON public.evolucoes FOR INSERT WITH CHECK ((public.can_access_company(auth.uid(), empresa_id) AND public.has_role(auth.uid(), 'dono_empresa'::public.app_role) AND (solicitado_por = auth.uid())));


--
-- Name: empresa_modulos Dono empresa pode ver módulos da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Dono empresa pode ver módulos da empresa" ON public.empresa_modulos FOR SELECT USING (public.can_access_company(auth.uid(), empresa_id));


--
-- Name: treinamento_progresso Dono empresa pode ver progresso da equipe; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Dono empresa pode ver progresso da equipe" ON public.treinamento_progresso FOR SELECT USING ((public.has_role(auth.uid(), 'dono_empresa'::public.app_role) AND public.can_access_company(auth.uid(), empresa_id)));


--
-- Name: tickets_suporte Empresa pode atualizar seus tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Empresa pode atualizar seus tickets" ON public.tickets_suporte FOR UPDATE USING (public.can_access_company(auth.uid(), empresa_id));


--
-- Name: tickets_suporte Empresa pode criar tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Empresa pode criar tickets" ON public.tickets_suporte FOR INSERT WITH CHECK ((public.can_access_company(auth.uid(), empresa_id) AND (usuario_id = auth.uid())));


--
-- Name: sistemas_clientes Empresa pode ver seu sistema; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Empresa pode ver seu sistema" ON public.sistemas_clientes FOR SELECT USING (public.can_access_company(auth.uid(), empresa_id));


--
-- Name: tickets_suporte Empresa pode ver seus tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Empresa pode ver seus tickets" ON public.tickets_suporte FOR SELECT USING (public.can_access_company(auth.uid(), empresa_id));


--
-- Name: treinamentos Empresa pode ver seus treinamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Empresa pode ver seus treinamentos" ON public.treinamentos FOR SELECT USING (((empresa_id IS NULL) OR public.can_access_company(auth.uid(), empresa_id)));


--
-- Name: evolucoes Empresa pode ver suas evolucoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Empresa pode ver suas evolucoes" ON public.evolucoes FOR SELECT USING (((empresa_id IS NULL) OR public.can_access_company(auth.uid(), empresa_id)));


--
-- Name: companies Evolutech can insert companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech can insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: invitations Evolutech can manage all invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech can manage all invitations" ON public.invitations TO authenticated USING (public.is_evolutech_user(auth.uid())) WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: user_roles Evolutech can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech can manage roles" ON public.user_roles TO authenticated USING (public.is_evolutech_user(auth.uid())) WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: companies Evolutech can update companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech can update companies" ON public.companies FOR UPDATE TO authenticated USING (public.is_evolutech_user(auth.uid())) WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: companies Evolutech can view all companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech can view all companies" ON public.companies FOR SELECT TO authenticated USING (public.is_evolutech_user(auth.uid()));


--
-- Name: profiles Evolutech can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_evolutech_user(auth.uid()));


--
-- Name: user_roles Evolutech can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_evolutech_user(auth.uid()));


--
-- Name: sistemas_base Evolutech pode atualizar sistemas base; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode atualizar sistemas base" ON public.sistemas_base FOR UPDATE USING (public.is_evolutech_user(auth.uid())) WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: sistemas_base Evolutech pode criar sistemas base; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode criar sistemas base" ON public.sistemas_base FOR INSERT WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: empresa_modulos Evolutech pode gerenciar empresa_modulos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode gerenciar empresa_modulos" ON public.empresa_modulos USING (public.is_evolutech_user(auth.uid())) WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: evolucoes Evolutech pode gerenciar evolucoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode gerenciar evolucoes" ON public.evolucoes USING (public.is_evolutech_user(auth.uid())) WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: modulos Evolutech pode gerenciar módulos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode gerenciar módulos" ON public.modulos USING (public.is_evolutech_user(auth.uid())) WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: sistema_base_modulos Evolutech pode gerenciar sistema_base_modulos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode gerenciar sistema_base_modulos" ON public.sistema_base_modulos USING (public.is_evolutech_user(auth.uid())) WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: sistemas_clientes Evolutech pode gerenciar sistemas clientes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode gerenciar sistemas clientes" ON public.sistemas_clientes USING (public.is_evolutech_user(auth.uid())) WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: tickets_suporte Evolutech pode gerenciar tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode gerenciar tickets" ON public.tickets_suporte USING (public.is_evolutech_user(auth.uid())) WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: treinamentos Evolutech pode gerenciar treinamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode gerenciar treinamentos" ON public.treinamentos USING (public.is_evolutech_user(auth.uid())) WITH CHECK (public.is_evolutech_user(auth.uid()));


--
-- Name: sistemas_base Evolutech pode ver sistemas base; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode ver sistemas base" ON public.sistemas_base FOR SELECT USING (public.is_evolutech_user(auth.uid()));


--
-- Name: treinamento_progresso Evolutech pode ver todo progresso; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode ver todo progresso" ON public.treinamento_progresso FOR SELECT USING (public.is_evolutech_user(auth.uid()));


--
-- Name: modulos Evolutech pode ver todos módulos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode ver todos módulos" ON public.modulos FOR SELECT USING (public.is_evolutech_user(auth.uid()));


--
-- Name: sistemas_clientes Evolutech pode ver todos sistemas clientes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode ver todos sistemas clientes" ON public.sistemas_clientes FOR SELECT USING (public.is_evolutech_user(auth.uid()));


--
-- Name: tickets_suporte Evolutech pode ver todos tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Evolutech pode ver todos tickets" ON public.tickets_suporte FOR SELECT USING (public.is_evolutech_user(auth.uid()));


--
-- Name: companies Super admin can delete companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can delete companies" ON public.companies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin_evolutech'::public.app_role));


--
-- Name: financial_metrics Super admin can manage metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can manage metrics" ON public.financial_metrics TO authenticated USING (public.has_role(auth.uid(), 'super_admin_evolutech'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'super_admin_evolutech'::public.app_role));


--
-- Name: audit_logs Super admin can view all logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can view all logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin_evolutech'::public.app_role));


--
-- Name: financial_metrics Super admin can view all metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can view all metrics" ON public.financial_metrics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin_evolutech'::public.app_role));


--
-- Name: sistemas_base Super admin pode deletar sistemas base; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin pode deletar sistemas base" ON public.sistemas_base FOR DELETE USING (public.has_role(auth.uid(), 'super_admin_evolutech'::public.app_role));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((id = auth.uid()));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: companies Users can view their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their company" ON public.companies FOR SELECT TO authenticated USING (public.can_access_company(auth.uid(), id));


--
-- Name: treinamento_progresso Usuario pode ver/gerenciar seu progresso; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuario pode ver/gerenciar seu progresso" ON public.treinamento_progresso USING ((usuario_id = auth.uid())) WITH CHECK (((usuario_id = auth.uid()) AND public.can_access_company(auth.uid(), empresa_id)));


--
-- Name: treinamentos Usuários podem ver treinamentos públicos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver treinamentos públicos" ON public.treinamentos FOR SELECT USING ((is_publico = true));


--
-- Name: sistema_base_modulos Visualização pública sistema_base_modulos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Visualização pública sistema_base_modulos" ON public.sistema_base_modulos FOR SELECT USING (true);


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: empresa_modulos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.empresa_modulos ENABLE ROW LEVEL SECURITY;

--
-- Name: evolucoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evolucoes ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: modulos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: sistema_base_modulos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sistema_base_modulos ENABLE ROW LEVEL SECURITY;

--
-- Name: sistemas_base; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sistemas_base ENABLE ROW LEVEL SECURITY;

--
-- Name: sistemas_clientes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sistemas_clientes ENABLE ROW LEVEL SECURITY;

--
-- Name: tickets_suporte; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tickets_suporte ENABLE ROW LEVEL SECURITY;

--
-- Name: treinamento_progresso; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.treinamento_progresso ENABLE ROW LEVEL SECURITY;

--
-- Name: treinamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;