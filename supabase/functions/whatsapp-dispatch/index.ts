import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DispatchPayload {
  empresa_id: string;
  telefone: string;
  evento: string; // agendamento, confirmacao, cancelamento, lembrete
  mensagem?: string;
  dados_extras?: Record<string, unknown>;
}

interface WebhookPayload {
  empresa_id: string;
  telefone: string;
  evento: string;
  mensagem: string;
  dados_extras?: Record<string, unknown>;
  timestamp: string;
  dispatch_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get authenticated user from request
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    const payload: DispatchPayload = await req.json();

    // Validate required fields
    if (!payload.empresa_id || !payload.telefone || !payload.evento) {
      return new Response(
        JSON.stringify({ 
          error: "Campos obrigatórios: empresa_id, telefone, evento" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone number (remove non-digits, ensure country code)
    const telefoneNormalizado = payload.telefone.replace(/\D/g, "");

    // Get company WhatsApp config
    const { data: config, error: configError } = await supabaseAdmin
      .from("whatsapp_config")
      .select("*")
      .eq("empresa_id", payload.empresa_id)
      .eq("is_active", true)
      .single();

    if (configError || !config) {
      // Log dispatch attempt without config
      await supabaseAdmin.from("whatsapp_dispatch").insert({
        empresa_id: payload.empresa_id,
        usuario_id: userId,
        evento: payload.evento,
        telefone: telefoneNormalizado,
        payload_enviado: payload,
        status: "erro",
        erro_mensagem: "Configuração de WhatsApp não encontrada ou inativa",
      });

      return new Response(
        JSON.stringify({ 
          error: "Configuração de WhatsApp não encontrada para esta empresa",
          status: "erro"
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create dispatch record
    const { data: dispatch, error: dispatchError } = await supabaseAdmin
      .from("whatsapp_dispatch")
      .insert({
        empresa_id: payload.empresa_id,
        usuario_id: userId,
        evento: payload.evento,
        telefone: telefoneNormalizado,
        payload_enviado: payload,
        status: "pendente",
        tentativas: 0,
      })
      .select()
      .single();

    if (dispatchError || !dispatch) {
      console.error("Erro ao criar dispatch:", dispatchError);
      return new Response(
        JSON.stringify({ error: "Erro ao registrar dispatch" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare webhook payload - SOMENTE dados, sem lógica de WhatsApp
    const webhookPayload: WebhookPayload = {
      empresa_id: payload.empresa_id,
      telefone: telefoneNormalizado,
      evento: payload.evento,
      mensagem: payload.mensagem || "",
      dados_extras: payload.dados_extras,
      timestamp: new Date().toISOString(),
      dispatch_id: dispatch.id,
    };

    let finalStatus = "disparado";
    let erroMensagem: string | null = null;
    let respostaWebhook: Record<string, unknown> | null = null;

    try {
      // Call external webhook with timeout and retry
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout_ms || 30000);

      const webhookHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add auth token if configured
      if (config.auth_token) {
        webhookHeaders["Authorization"] = `Bearer ${config.auth_token}`;
      }

      const response = await fetch(config.webhook_url, {
        method: "POST",
        headers: webhookHeaders,
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        try {
          respostaWebhook = await response.json();
        } catch {
          respostaWebhook = { status: response.status, statusText: response.statusText };
        }
        finalStatus = "disparado";
      } else {
        finalStatus = "erro";
        erroMensagem = `Webhook retornou status ${response.status}`;
        respostaWebhook = { 
          status: response.status, 
          statusText: response.statusText 
        };
      }
    } catch (error: unknown) {
      const isAbortError = error instanceof Error && error.name === "AbortError";
      finalStatus = isAbortError ? "timeout" : "erro";
      erroMensagem = error instanceof Error ? error.message : "Erro desconhecido";
    }

    // Update dispatch record with result
    await supabaseAdmin
      .from("whatsapp_dispatch")
      .update({
        status: finalStatus,
        data_disparo: new Date().toISOString(),
        tentativas: dispatch.tentativas + 1,
        erro_mensagem: erroMensagem,
        resposta_webhook: respostaWebhook,
      })
      .eq("id", dispatch.id);

    return new Response(
      JSON.stringify({
        success: finalStatus === "disparado",
        dispatch_id: dispatch.id,
        status: finalStatus,
        message: finalStatus === "disparado" 
          ? "Evento disparado com sucesso para processamento externo"
          : `Falha no dispatch: ${erroMensagem}`,
      }),
      { 
        status: finalStatus === "disparado" ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("Erro no whatsapp-dispatch:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
