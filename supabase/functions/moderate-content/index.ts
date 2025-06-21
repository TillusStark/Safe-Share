
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define violation categories that automatically result in blocking
const VIOLATION_CATEGORIES = [
  "personal information",
  "personal data",
  "violence",
  "harassment", 
  "adult content",
  "nudity",
  "harmful content",
  "dangerous content"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  
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
    const { filename, type, caption, imageData } = await req.json();

    if (!openAIApiKey) {
      console.error("Missing OpenAI API Key.");
      return new Response(JSON.stringify({ 
        status: 'failed', 
        issues: [{ 
          category: "Configuration Error", 
          description: "Content moderation is currently unavailable. Upload blocked for safety.", 
          severity: "high" 
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

    console.log("Processing enhanced moderation check for:", filename);

    // Enhanced system prompt for strict content moderation
    const systemPrompt = `You are a strict content moderator for a social media platform. Analyze the provided image and any caption for policy violations.

CRITICAL VIOLATIONS (automatically block):
1. PERSONAL INFORMATION: faces, government IDs, documents, addresses, phone numbers, email addresses, credit cards, licenses
2. VIOLENCE & HARASSMENT: weapons, fighting, threatening gestures, hate symbols, bullying content
3. ADULT CONTENT & NUDITY: exposed intimate body parts, sexual content, suggestive poses
4. HARMFUL CONTENT: drugs, self-harm activities, dangerous stunts, illegal activities

RESPONSE FORMAT: Respond ONLY in JSON format:
{
  "status": "passed" | "failed",
  "confidence": 0-100,
  "issues": [
    {
      "category": "exact violation category",
      "description": "specific description of what was detected",
      "severity": "high" | "medium" | "low",
      "confidence": 0-100
    }
  ]
}

INSTRUCTIONS:
- Set status to "failed" for ANY violation with >60% confidence
- Set status to "passed" only if NO violations detected
- Be strict but accurate - false positives are better than missed violations
- Analyze both image content AND caption text thoroughly`;

    // Prepare messages for OpenAI
    const messages = [
      { role: "system", content: systemPrompt }
    ];

    // Add image analysis if image data is provided
    if (imageData) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this image for content violations:\nFilename: ${filename}\nType: ${type}${caption ? `\nCaption: ${caption}` : ""}`
          },
          {
            type: "image_url",
            image_url: {
              url: imageData
            }
          }
        ]
      });
    } else {
      // Fallback to text-only analysis
      const contentDescription = caption 
        ? `Filename: ${filename}\nType: ${type}\nCaption: ${caption}` 
        : `Filename: ${filename}\nType: ${type}`;
      
      messages.push({
        role: "user",
        content: `Analyze this content for violations:\n${contentDescription}`
      });
    }

    console.log("Sending request to OpenAI GPT-4o for image analysis");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 500,
        temperature: 0.1, // Very low temperature for consistent moderation
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, await response.text());
      return new Response(JSON.stringify({ 
        status: 'failed',
        issues: [{ 
          category: "Service Error", 
          description: "Content analysis failed. Upload blocked for safety.", 
          severity: "high" 
        }] 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const json = await response.json();
    console.log("Raw OpenAI response:", JSON.stringify(json));

    let aiMessage = json.choices?.[0]?.message?.content?.trim();
    console.log("AI moderation result:", aiMessage);

    let result;
    try {
      if (!aiMessage) throw new Error("AI response is empty");
      
      result = JSON.parse(aiMessage);
      
      // Ensure proper structure
      if (!result.status) result.status = 'failed'; // Default to blocking
      if (!Array.isArray(result.issues)) result.issues = [];
      
      // Enhanced blocking logic - any violation with confidence >60% gets blocked
      if (result.status === 'passed' && result.issues.length > 0) {
        const highConfidenceViolations = result.issues.filter(issue => 
          issue.confidence > 60 || issue.severity === 'high'
        );
        
        if (highConfidenceViolations.length > 0) {
          result.status = 'failed';
          console.log(`Blocking content due to high-confidence violations: ${JSON.stringify(highConfidenceViolations)}`);
        }
      }
      
      // Additional safety check for violation categories
      const hasKnownViolations = result.issues.some(issue => 
        VIOLATION_CATEGORIES.some(category => 
          issue.category?.toLowerCase().includes(category.toLowerCase())
        )
      );
      
      if (hasKnownViolations && result.status !== 'failed') {
        result.status = 'failed';
        console.log("Blocking content due to known violation categories");
      }
      
      console.log("Final moderation result:", JSON.stringify(result));

    } catch (err) {
      console.error("Error parsing AI response:", err, "Raw AI message:", aiMessage);
      // On parsing errors, default to blocking for safety
      result = { 
        status: 'failed',
        issues: [{ 
          category: "Analysis Error", 
          description: "Could not analyze content properly. Upload blocked for safety.", 
          severity: "high",
          confidence: 100
        }] 
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Overall moderation error:", error);
    // All errors result in blocking for safety
    return new Response(JSON.stringify({ 
      status: 'failed',
      issues: [{ 
        category: "System Error", 
        description: "Content moderation system error. Upload blocked for safety.", 
        severity: "high",
        confidence: 100
      }]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, 
    });
  }
});
