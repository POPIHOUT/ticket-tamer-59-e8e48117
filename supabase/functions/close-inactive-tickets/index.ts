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

    // Calculate the date 15 days ago
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    console.log("Checking for inactive tickets older than:", fifteenDaysAgo.toISOString());

    // Find tickets that haven't been updated in 15 days and are not already closed
    const { data: inactiveTickets, error: fetchError } = await supabase
      .from("tickets")
      .select("id, title, updated_at")
      .neq("status", "closed")
      .lt("updated_at", fifteenDaysAgo.toISOString());

    if (fetchError) {
      console.error("Error fetching inactive tickets:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${inactiveTickets?.length || 0} inactive tickets`);

    if (!inactiveTickets || inactiveTickets.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No inactive tickets to close",
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
