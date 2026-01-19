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
    const { slug, message, sessionId, conversationId } = await req.json();

    if (!slug || !message || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: slug, message, sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get chatbot config
    const { data: chatbot, error: chatbotError } = await supabaseAdmin
      .from('company_chatbots')
      .select('*, company:companies(name)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (chatbotError || !chatbot) {
      console.error('Chatbot not found:', chatbotError);
      return new Response(
        JSON.stringify({ error: 'Chatbot not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle external chatbot integration
    if (chatbot.chatbot_type === 'external') {
      if (!chatbot.external_webhook_url) {
        return new Response(
          JSON.stringify({ error: 'External webhook not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const externalResponse = await fetch(chatbot.external_webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(chatbot.external_api_key ? { 'Authorization': `Bearer ${chatbot.external_api_key}` } : {}),
          },
          body: JSON.stringify({ message, sessionId }),
        });

        const externalData = await externalResponse.json();
        return new Response(
          JSON.stringify({ reply: externalData.reply || externalData.message || 'Sem resposta' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (externalError) {
        console.error('External webhook error:', externalError);
        return new Response(
          JSON.stringify({ error: 'Error connecting to external chatbot' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // AI Chatbot - get or create conversation
    let activeConversationId = conversationId;
    
    if (!activeConversationId) {
      const { data: newConversation, error: convError } = await supabaseAdmin
        .from('chatbot_conversations')
        .insert({
          chatbot_id: chatbot.id,
          session_id: sessionId,
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return new Response(
          JSON.stringify({ error: 'Error creating conversation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      activeConversationId = newConversation.id;
    }

    // Save user message
    await supabaseAdmin
      .from('chatbot_messages')
      .insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: message,
      });

    // Get conversation history
    const { data: history } = await supabaseAdmin
      .from('chatbot_messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    const messages = [
      {
        role: 'system',
        content: `${chatbot.system_prompt || 'Você é um assistente virtual prestativo.'}
        
Você está atendendo pela empresa: ${chatbot.company?.name || 'Nossa Empresa'}
Seja sempre educado, profissional e útil.`,
      },
      ...(history || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Muitas solicitações. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Serviço temporariamente indisponível.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro ao processar sua mensagem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const assistantReply = aiData.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.';

    // Save assistant message
    await supabaseAdmin
      .from('chatbot_messages')
      .insert({
        conversation_id: activeConversationId,
        role: 'assistant',
        content: assistantReply,
      });

    console.log(`Chatbot ${chatbot.name} replied to session ${sessionId}`);

    return new Response(
      JSON.stringify({ 
        reply: assistantReply,
        conversationId: activeConversationId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
