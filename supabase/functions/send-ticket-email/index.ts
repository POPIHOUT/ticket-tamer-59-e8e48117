import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TicketEmailRequest {
  ticketId: string;
  title: string;
  description: string;
  priority: string;
  userName: string;
  userEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, title, description, priority, userName, userEmail }: TicketEmailRequest = await req.json();

    console.log("Sending ticket notification email:", { ticketId, title, userEmail });

    const ticketUrl = `${Deno.env.get("SUPABASE_URL")?.replace("https://", "https://jxkiyamkpxptcyodznhe.")}/conversation/${ticketId}`;

    const priorityColors: Record<string, string> = {
      low: "#10b981",
      medium: "#f59e0b",
      high: "#ef4444",
      urgent: "#dc2626",
    };

    const priorityColor = priorityColors[priority] || "#6b7280";

    const emailResponse = await resend.emails.send({
      from: "HotHost Support <tickets@hothost.org>",
      to: ["info@hothost.org"],
      subject: `Nový ticket: ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nový Support Ticket</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                          🎫 Nový Support Ticket
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <div style="margin-bottom: 25px;">
                          <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 22px; font-weight: 600;">
                            ${title}
                          </h2>
                          <div style="display: inline-block; background-color: ${priorityColor}; color: #ffffff; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                            ${priority}
                          </div>
                        </div>
                        
                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #dc2626;">
                          <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
                            ${description.replace(/\n/g, '<br>')}
                          </p>
                        </div>
                        
                        <div style="margin-bottom: 25px; padding: 15px; background-color: #fef2f2; border-radius: 6px;">
                          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-weight: 600;">
                            POUŽÍVATEĽ
                          </p>
                          <p style="margin: 0 0 4px 0; color: #111827; font-size: 15px; font-weight: 500;">
                            ${userName}
                          </p>
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">
                            ${userEmail}
                          </p>
                        </div>
                        
                        <!-- Button -->
                        <div style="text-align: center; margin-top: 30px;">
                          <a href="${ticketUrl}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);">
                            Zobraziť Ticket
                          </a>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #6b7280; font-size: 13px;">
                          Ticket ID: <strong style="color: #111827;">${ticketId}</strong>
                        </p>
                        <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                          © 2025 HotHost.org - Support System
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending ticket notification email:", error);
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
