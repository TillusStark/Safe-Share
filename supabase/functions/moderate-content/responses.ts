
import { corsHeaders } from "./auth.ts";
import { ModerationResult } from "./types.ts";

export function createErrorResponse(message: string, category: string = "Configuration Error"): Response {
  return new Response(JSON.stringify({ 
    status: 'failed', 
    issues: [{ 
      category, 
      description: message, 
      severity: "high",
      confidence: 100
    }] 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

export function createSuccessResponse(result: ModerationResult): Response {
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

export function createSystemErrorResponse(): Response {
  return new Response(JSON.stringify({ 
    status: 'failed',
    confidence: 100,
    violation_category: "system_error",
    issues: [{ 
      category: "System Error", 
      description: "Content moderation system error. Upload blocked for safety.", 
      severity: "high",
      confidence: 100,
      blocking_reason: "Critical system error during content analysis"
    }]
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200, 
  });
}
