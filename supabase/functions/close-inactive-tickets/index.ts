import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 10 days ago
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    console.log("Checking for inactive tickets older than:", tenDaysAgo.toISOString());

    // Find tickets that:
    // 1. Status is 'waiting_for_response'
    // 2. Haven't been updated in 10 days
    // 3. Priority is NOT 'urgent'
    const { data: inactiveTickets, error: fetchError } = await supabase
      .from("tickets")
      .select("id, title, updated_at, priority")
      .eq("status", "waiting_for_response")
      .neq("priority", "urgent")
      .lt("updated_at", tenDaysAgo.toISOString());

    if (fetchError) {
      console.error("Error fetching inactive tickets:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${inactiveTickets?.length || 0} inactive tickets (waiting_for_response, non-urgent)`);

    if (!inactiveTickets || inactiveTickets.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No inactive tickets to close (checking waiting_for_response, non-urgent only)",
          closedCount: 0
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Close the inactive tickets
    const ticketIds = inactiveTickets.map(ticket => ticket.id);
    
    const { error: updateError } = await supabase
      .from("tickets")
      .update({ 
        status: "closed",
        closed_at: new Date().toISOString()
      })
      .in("id", ticketIds);

    if (updateError) {
      console.error("Error closing tickets:", updateError);
      throw updateError;
    }

    console.log(`Successfully closed ${inactiveTickets.length} tickets`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Closed ${inactiveTickets.length} inactive tickets`,
        closedCount: inactiveTickets.length,
        closedTickets: inactiveTickets.map(t => ({ id: t.id, title: t.title }))
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in close-inactive-tickets function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
