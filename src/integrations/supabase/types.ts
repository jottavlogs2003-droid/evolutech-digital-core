export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          company_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          company_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          company_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          monthly_revenue: number | null
          name: string
          plan: Database["public"]["Enums"]["plan_type"]
          sistema_base_id: string | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          monthly_revenue?: number | null
          name: string
          plan?: Database["public"]["Enums"]["plan_type"]
          sistema_base_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          monthly_revenue?: number | null
          name?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          sistema_base_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_sistema_base_id_fkey"
            columns: ["sistema_base_id"]
            isOneToOne: false
            referencedRelation: "sistemas_base"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_modulos: {
        Row: {
          ativo: boolean | null
          created_at: string
          data_ativacao: string | null
          data_desativacao: string | null
          empresa_id: string
          id: string
          modulo_id: string
          obrigatorio: boolean | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          data_ativacao?: string | null
          data_desativacao?: string | null
          empresa_id: string
          id?: string
          modulo_id: string
          obrigatorio?: boolean | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          data_ativacao?: string | null
          data_desativacao?: string | null
          empresa_id?: string
          id?: string
          modulo_id?: string
          obrigatorio?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_modulos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_modulos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      evolucoes: {
        Row: {
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          descricao: string
          desenvolvedor_responsavel: string | null
          empresa_id: string | null
          id: string
          prioridade: string | null
          sistema_base_id: string | null
          solicitado_por: string | null
          status: string | null
          tipo: string | null
          titulo: string
          updated_at: string
          versao_alvo: string | null
        }
        Insert: {
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao: string
          desenvolvedor_responsavel?: string | null
          empresa_id?: string | null
          id?: string
          prioridade?: string | null
          sistema_base_id?: string | null
          solicitado_por?: string | null
          status?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string
          versao_alvo?: string | null
        }
        Update: {
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao?: string
          desenvolvedor_responsavel?: string | null
          empresa_id?: string | null
          id?: string
          prioridade?: string | null
          sistema_base_id?: string | null
          solicitado_por?: string | null
          status?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
          versao_alvo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolucoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolucoes_sistema_base_id_fkey"
            columns: ["sistema_base_id"]
            isOneToOne: false
            referencedRelation: "sistemas_base"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_metrics: {
        Row: {
          active_users: number | null
          churn_rate: number | null
          company_id: string | null
          created_at: string
          id: string
          month: string
          mrr: number | null
          new_customers: number | null
          revenue: number | null
        }
        Insert: {
          active_users?: number | null
          churn_rate?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          month: string
          mrr?: number | null
          new_customers?: number | null
          revenue?: number | null
        }
        Update: {
          active_users?: number | null
          churn_rate?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          month?: string
          mrr?: number | null
          new_customers?: number | null
          revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["entity_status"]
          token: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["entity_status"]
          token?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["entity_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          codigo: string
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          is_core: boolean | null
          nome: string
          preco_mensal: number | null
          status: Database["public"]["Enums"]["entity_status"] | null
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          is_core?: boolean | null
          nome: string
          preco_mensal?: number | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          is_core?: boolean | null
          nome?: string
          preco_mensal?: number | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sistema_base_modulos: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          modulo_id: string
          sistema_base_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          modulo_id: string
          sistema_base_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          modulo_id?: string
          sistema_base_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sistema_base_modulos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sistema_base_modulos_sistema_base_id_fkey"
            columns: ["sistema_base_id"]
            isOneToOne: false
            referencedRelation: "sistemas_base"
            referencedColumns: ["id"]
          },
        ]
      }
      sistemas_base: {
        Row: {
          configuracoes: Json | null
          created_at: string
          descricao: string | null
          id: string
          nicho: string
          nome: string
          status: Database["public"]["Enums"]["entity_status"] | null
          updated_at: string
          versao: string | null
        }
        Insert: {
          configuracoes?: Json | null
          created_at?: string
          descricao?: string | null
          id?: string
          nicho: string
          nome: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string
          versao?: string | null
        }
        Update: {
          configuracoes?: Json | null
          created_at?: string
          descricao?: string | null
          id?: string
          nicho?: string
          nome?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string
          versao?: string | null
        }
        Relationships: []
      }
      sistemas_clientes: {
        Row: {
          configuracoes: Json | null
          created_at: string
          data_ativacao: string | null
          empresa_id: string
          id: string
          nome_customizado: string | null
          sistema_base_id: string
          status: Database["public"]["Enums"]["entity_status"] | null
          updated_at: string
        }
        Insert: {
          configuracoes?: Json | null
          created_at?: string
          data_ativacao?: string | null
          empresa_id: string
          id?: string
          nome_customizado?: string | null
          sistema_base_id: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string
        }
        Update: {
          configuracoes?: Json | null
          created_at?: string
          data_ativacao?: string | null
          empresa_id?: string
          id?: string
          nome_customizado?: string | null
          sistema_base_id?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sistemas_clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sistemas_clientes_sistema_base_id_fkey"
            columns: ["sistema_base_id"]
            isOneToOne: false
            referencedRelation: "sistemas_base"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets_suporte: {
        Row: {
          atribuido_para: string | null
          categoria: string | null
          created_at: string
          data_resolucao: string | null
          descricao: string
          empresa_id: string
          id: string
          prioridade: string | null
          resposta: string | null
          status: string | null
          titulo: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          atribuido_para?: string | null
          categoria?: string | null
          created_at?: string
          data_resolucao?: string | null
          descricao: string
          empresa_id: string
          id?: string
          prioridade?: string | null
          resposta?: string | null
          status?: string | null
          titulo: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          atribuido_para?: string | null
          categoria?: string | null
          created_at?: string
          data_resolucao?: string | null
          descricao?: string
          empresa_id?: string
          id?: string
          prioridade?: string | null
          resposta?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_suporte_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamento_progresso: {
        Row: {
          concluido: boolean | null
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          empresa_id: string
          id: string
          progresso_percentual: number | null
          treinamento_id: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          concluido?: boolean | null
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          empresa_id: string
          id?: string
          progresso_percentual?: number | null
          treinamento_id: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          concluido?: boolean | null
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          empresa_id?: string
          id?: string
          progresso_percentual?: number | null
          treinamento_id?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamento_progresso_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamento_progresso_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamentos: {
        Row: {
          created_at: string
          descricao: string | null
          duracao_minutos: number | null
          empresa_id: string | null
          id: string
          is_publico: boolean | null
          modulo_id: string | null
          ordem: number | null
          status: Database["public"]["Enums"]["entity_status"] | null
          tipo: string | null
          titulo: string
          updated_at: string
          url_conteudo: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number | null
          empresa_id?: string | null
          id?: string
          is_publico?: boolean | null
          modulo_id?: string | null
          ordem?: number | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          tipo?: string | null
          titulo: string
          updated_at?: string
          url_conteudo?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number | null
          empresa_id?: string | null
          id?: string
          is_publico?: boolean | null
          modulo_id?: string | null
          ordem?: number | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
          url_conteudo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treinamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamentos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_owner: {
        Args: { _empresa_id: string; _user_id: string }
        Returns: boolean
      }
      is_evolutech_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin_evolutech"
        | "admin_evolutech"
        | "dono_empresa"
        | "funcionario_empresa"
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "activate"
        | "deactivate"
        | "invite"
        | "role_change"
      entity_status: "active" | "inactive" | "pending"
      plan_type: "starter" | "professional" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin_evolutech",
        "admin_evolutech",
        "dono_empresa",
        "funcionario_empresa",
      ],
      audit_action: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "activate",
        "deactivate",
        "invite",
        "role_change",
      ],
      entity_status: ["active", "inactive", "pending"],
      plan_type: ["starter", "professional", "enterprise"],
    },
  },
} as const
