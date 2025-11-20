import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, ticketId, userId } = await req.json();

    console.log('HotHost AI Chat - Processing ticket:', ticketId);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get ticket details
    const { data: ticket } = await supabase
      .from('tickets')
      .select('priority, status')
      .eq('id', ticketId)
      .single();

    // Check if ticket has been taken over by support
    const { data: assignment } = await supabase
      .from('ticket_assignments')
      .select('*')
      .eq('ticket_id', ticketId)
      .maybeSingle();

    // If ticket is taken over by support, don't respond
    if (assignment) {
      return new Response(
        JSON.stringify({ action: "no_response", reason: "Ticket taken over by support" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Don't respond to urgent tickets
    if (ticket?.priority === 'urgent') {
      return new Response(
        JSON.stringify({ action: "no_response", reason: "Urgent tickets are handled by human support only" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are HotHost.org AI Agent, a helpful support assistant for HotHost - a provider of Minecraft hosting, Discord bots, and Web hosting services.

IMPORTANT INFORMATION:
- Company: HotHost
- Services: Minecraft server hosting, Discord bot hosting, Web hosting
- Discord: You can find us on Discord (main support channel)
- Email: info@hothost.org
- Support Portal: www.support.hothost.org

CRITICAL INSTRUCTIONS:
1. If the user asks to connect to an operator, transfer to support, speak to a human, or similar requests, respond EXACTLY with:
   "Connecting to operator..."
   Then return this JSON: {"action": "escalate", "reason": "User requested human support"}

2. For all other questions:
   - Be helpful, professional, and concise
   - Provide accurate information about HotHost services
   - If you don't know something, admit it and suggest contacting support

3. Keep responses clear and under 150 words unless more detail is needed

4. Always be polite and customer-focused`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits depleted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in hothost-ai-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
