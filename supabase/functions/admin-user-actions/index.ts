import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id);

    const isEvolutech = callerRoles?.some((r: any) =>
      ['super_admin_evolutech', 'admin_evolutech'].includes(r.role)
    );
    const isSuperAdmin = callerRoles?.some((r: any) => r.role === 'super_admin_evolutech');

    if (!isEvolutech) {
      return new Response(JSON.stringify({ error: 'Apenas admins Nexify podem executar esta ação' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, user_id, new_password, company_id } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Ação não informada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Self-protection
    if (user_id && user_id === caller.id) {
      return new Response(JSON.stringify({ error: 'Você não pode executar esta ação em si mesmo' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'reset_password': {
        if (!user_id || !new_password || new_password.length < 6) {
          return new Response(JSON.stringify({ error: 'Senha inválida (mín. 6 caracteres)' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { password: new_password });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, message: 'Senha redefinida' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'block_user':
      case 'unblock_user': {
        if (!user_id) {
          return new Response(JSON.stringify({ error: 'user_id obrigatório' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const isBlock = action === 'block_user';
        // Update profile.is_active and ban via auth admin
        const { error: pErr } = await supabaseAdmin
          .from('profiles')
          .update({ is_active: !isBlock })
          .eq('id', user_id);
        if (pErr) throw pErr;
        const { error: aErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          ban_duration: isBlock ? '876000h' : 'none',
        } as any);
        if (aErr) console.error('Ban error:', aErr);
        return new Response(JSON.stringify({ success: true, message: isBlock ? 'Usuário bloqueado' : 'Usuário desbloqueado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete_user': {
        if (!isSuperAdmin) {
          return new Response(JSON.stringify({ error: 'Apenas Super Admin pode excluir usuários' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!user_id) {
          return new Response(JSON.stringify({ error: 'user_id obrigatório' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        await supabaseAdmin.from('user_roles').delete().eq('user_id', user_id);
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, message: 'Usuário excluído' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'block_company':
      case 'unblock_company': {
        if (!company_id) {
          return new Response(JSON.stringify({ error: 'company_id obrigatório' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const newStatus = action === 'block_company' ? 'inactive' : 'active';
        const { error } = await supabaseAdmin
          .from('companies')
          .update({ status: newStatus })
          .eq('id', company_id);
        if (error) throw error;

        // Also block/unblock all users of that company
        const { data: companyUsers } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('company_id', company_id);

        if (companyUsers) {
          const isBlock = action === 'block_company';
          await supabaseAdmin.from('profiles').update({ is_active: !isBlock }).eq('company_id', company_id);
          for (const u of companyUsers) {
            await supabaseAdmin.auth.admin.updateUserById(u.id, {
              ban_duration: isBlock ? '876000h' : 'none',
            } as any).catch(() => {});
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação desconhecida' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: any) {
    console.error('admin-user-actions error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
