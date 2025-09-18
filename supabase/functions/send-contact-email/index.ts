import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  message: string;
  to: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message, to }: ContactEmailRequest = await req.json();

    // Determine if this is a feedback email (system emails have feedback@system.com)
    const isFeedback = email === "feedback@system.com";
    
    const emailResponse = await resend.emails.send({
      from: "Portfolio Contact <pauloabaquita098956@gmail.com>",
      to: [to],
      subject: isFeedback ? `New Feedback Received from ${name}` : `New Contact Form Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8e35ef;">${isFeedback ? 'New Feedback Submission' : 'New Contact Form Submission'}</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">${isFeedback ? 'Feedback Details' : 'Contact Details'}</h3>
            <p><strong>Name:</strong> ${name}</p>
            ${!isFeedback ? `<p><strong>Email:</strong> ${email}</p>` : ''}
          </div>
          
          <div style="background: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #333;">${isFeedback ? 'Feedback' : 'Message'}</h3>
            <p style="line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: ${isFeedback ? '#f0f8ff' : '#e8f5e8'}; border-radius: 8px;">
            <p style="margin: 0; color: ${isFeedback ? '#1e3a8a' : '#2d5a2d'}; font-size: 14px;">
              ${isFeedback 
                ? 'This feedback was submitted through your website feedback widget.' 
                : `This message was sent from your portfolio contact form. Reply directly to <strong>${email}</strong> to respond to ${name}.`
              }
            </p>
          </div>
        </div>
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
    console.error("Error in send-contact-email function:", error);
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