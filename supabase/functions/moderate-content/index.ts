
```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define critical categories that should escalate a warning to a failure
const CRITICAL_ISSUE_CATEGORIES_KEYWORDS = [
  "personal data",
  "personal information",
  "violent",
  "violence",
  "harassment",
  "adult content",
  "nudity",
  "harmful content",
  "hate speech",
  "illegal activities",
  "self-harm",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication first
  const authHeader = req.headers.get('Authorization');
  
  // Skip authentication check if not in production or authorization header exists
  // but we'll give a warning if OpenAI API key is missing
  if (!authHeader && req.headers.get('host') !== 'localhost:54321') {
    console.error("Missing authorization header");
    return new Response(JSON.stringify({ 
      code: 401, 
      message: "Missing authorization header" 
    }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { filename, type, caption } = await req.json();

    if (!openAIApiKey) {
      console.error("Missing OpenAI API Key.");
      return new Response(JSON.stringify({ 
        status: 'warning', 
        issues: [{ 
          category: "Configuration", 
          description: "OpenAI API key not configured. Moderation check skipped, manual review required.", 
          severity: "medium" 
        }] 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    if (!filename || !type) {
      console.error("Missing required fields:", { filename, type });
      return new Response(JSON.stringify({ error: "Missing filename or type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Include caption in the moderation check if available
    const contentDescription = caption 
      ? `Filename: ${filename}\nType: ${type}\nCaption: ${caption}` 
      : `Filename: ${filename}\nType: ${type}`;

    console.log("Processing moderation check for:", contentDescription);

    // Prompt OpenAI to act as a guideline moderation checker for uploads
    const messages = [
      { 
        role: "system", 
        content: "You are an AI content moderator tasked with detecting any personal data, violent, adult, or harmful content based on filename, file type, and caption. Be strict about potential violations. Respond in JSON with: { status: 'passed' | 'failed' | 'warning', issues: [{ category, description, severity: 'low' | 'medium' | 'high' }] }. If content appears safe, set status to 'passed' with empty issues array. For clear violations, use 'failed'. Use 'warning' for borderline cases but be specific about category and severity." 
      },
      { 
        role: "user", 
        content: `${contentDescription}\n\nAnalyze this content for potential community guideline violations.` 
      }
    ];

    console.log("Sending request to OpenAI moderation API");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 500,
        temperature: 0.5, // Slightly lower temperature for more deterministic moderation
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, await response.text());
      return new Response(JSON.stringify({ 
        status: 'warning', // API error itself is a warning to allow upload but flag for review
        issues: [{ 
          category: "Service Error", 
          description: "Could not perform content moderation check due to an API issue. You may proceed, but content will be subject to manual review.", 
          severity: "medium" 
        }] 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const json = await response.json();
    console.log("Raw OpenAI response:", JSON.stringify(json));

    let aiMessage = json.choices?.[0]?.message?.content?.trim();
    console.log("AI message (content):", aiMessage);

    // Try to parse the AI result; fallback to 'warning'
    let result;
    try {
      if (!aiMessage) throw new Error("AI message content is empty or undefined.");
      result = JSON.parse(aiMessage);
      if (!result.status) { result.status = 'warning'; } // Default to warning if status is missing
      if (!Array.isArray(result.issues)) { result.issues = []; }
      
      // **New logic to escalate warnings to failures for critical issues**
      if (result.status === 'warning' && result.issues.length > 0) {
        let shouldBeFailed = false;
        let escalationReason = "";

        for (const issue of result.issues) {
          const issueCategoryLower = issue.category?.toLowerCase() || "";
          if (issue.severity === 'high') {
            shouldBeFailed = true;
            escalationReason = `High severity issue: ${issue.category}`;
            break;
          }
          if (CRITICAL_ISSUE_CATEGORIES_KEYWORDS.some(keyword => issueCategoryLower.includes(keyword))) {
            shouldBeFailed = true;
            escalationReason = `Critical category detected: ${issue.category}`;
            break;
          }
        }

        if (shouldBeFailed) {
          console.log(`Warning escalated to 'failed'. Reason: ${escalationReason}. Original issues: ${JSON.stringify(result.issues)}`);
          result.status = 'failed';
          // Add a new issue or modify an existing one to reflect the escalation
          result.issues.push({
            category: "Policy Violation Override",
            description: `Content moderation status escalated to 'failed' due to: ${escalationReason}. Original AI assessment was 'warning'.`,
            severity: "high"
          });
        }
      }
      
      console.log("Final moderation result:", JSON.stringify(result));

    } catch (err) {
      console.error("Error parsing AI response or processing result:", err, "Raw AI message:", aiMessage);
      result = { 
        status: 'warning', // Parsing error results in a warning, allowing upload but flagging for review
        issues: [{ 
          category: "Processing Error", 
          description: "Could not interpret moderation results. You may proceed, but content will be subject to manual review.", 
          severity: "medium" 
        }] 
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Overall AI moderation error:", error);
    // Catch-all error also results in a 'warning' to allow upload but ensure manual review.
    return new Response(JSON.stringify({ 
      status: 'warning',
      issues: [{ 
        category: "System Error", 
        description: "An unexpected error occurred during moderation. You may proceed, but content will be subject to manual review.", 
        severity: "medium" 
      }]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, 
    });
  }
});
```

