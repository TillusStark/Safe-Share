
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filename, type } = await req.json();

    if (!openAIApiKey) {
      throw new Error("Missing OpenAI API Key.");
    }
    if (!filename || !type) {
      return new Response(JSON.stringify({ error: "Missing filename or type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Prompt OpenAI to act as a guideline moderation checker for uploads
    const messages = [
      { role: "system", content: "You are an AI content moderator. Detect any personal data, violent, adult, or harmful content based on filename and type provided. Respond in JSON with: { status: 'passed' | 'failed' | 'warning', issues: [{ category, description, severity }] }. Keep issues array empty if content appears safe." },
      { role: "user", content: `Filename: ${filename}\nType: ${type}\nIs this likely to violate community safety guidelines?` }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 300,
      }),
    });

    const json = await response.json();

    let aiMessage = json.choices?.[0]?.message?.content?.trim();

    // Try to parse the AI result; fallback to 'warning'
    let result;
    try {
      result = JSON.parse(aiMessage);
      if (!result.status) { result.status = 'warning'; }
      if (!Array.isArray(result.issues)) { result.issues = []; }
    } catch (err) {
      result = { status: 'warning', issues: [{ category: "moderation", description: "Could not parse AI result", severity: "medium" }] };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("AI moderation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
