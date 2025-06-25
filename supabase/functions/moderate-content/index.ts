
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuth, createUnauthorizedResponse } from "./auth.ts";
import { analyzeContent } from "./analysis.ts";
import { createErrorResponse, createSuccessResponse, createSystemErrorResponse } from "./responses.ts";
import { ModerationRequest } from "./types.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!validateAuth(req)) {
    return createUnauthorizedResponse();
  }

  try {
    const requestData: ModerationRequest = await req.json();
    const { filename, type } = requestData;

    if (!openAIApiKey) {
      console.error("Missing OpenAI API Key.");
      return createErrorResponse("Content moderation is currently unavailable. Upload blocked for safety.");
    }
    
    if (!filename || !type) {
      console.error("Missing required fields:", { filename, type });
      return new Response(JSON.stringify({ error: "Missing filename or type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const result = await analyzeContent(requestData, openAIApiKey);
    return createSuccessResponse(result);

  } catch (error) {
    console.error("Overall moderation error:", error);
    return createSystemErrorResponse();
  }
});
