
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define critical violation categories that automatically result in blocking
const CRITICAL_VIOLATIONS = {
  PERSONAL_INFO: "personal_information",
  VIOLENCE: "violence_harassment", 
  ADULT_CONTENT: "adult_content_nudity",
  HARMFUL_CONTENT: "harmful_dangerous_content"
};

// Confidence thresholds for automatic blocking
const BLOCKING_THRESHOLDS = {
  HIGH_CONFIDENCE: 70,
  MEDIUM_CONFIDENCE: 60,
  LOW_CONFIDENCE: 50
};

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
          severity: "high",
          confidence: 100
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

    console.log("Processing ZERO-TOLERANCE moderation check for:", filename);

    // Ultra-strict system prompt for zero-tolerance content moderation
    const systemPrompt = `You are an ULTRA-STRICT content moderator with ZERO TOLERANCE for policy violations. Your job is to identify and BLOCK any content that violates our community guidelines.

CRITICAL VIOLATIONS (IMMEDIATE BLOCK - NO EXCEPTIONS):

1. PERSONAL INFORMATION (${CRITICAL_VIOLATIONS.PERSONAL_INFO}):
   - ANY visible faces of real people
   - Government IDs, licenses, passports, documents  
   - Street addresses, house numbers, location signs
   - Phone numbers, email addresses visible in image
   - Credit cards, bank statements, financial documents
   - Social security numbers, personal identification
   - Handwritten personal information
   - Screenshots containing personal data

2. VIOLENCE & HARASSMENT (${CRITICAL_VIOLATIONS.VIOLENCE}):
   - Weapons (guns, knives, clubs, martial arts weapons)
   - Fighting, physical altercations, aggressive gestures
   - Blood, injuries, violence aftermath
   - Threatening poses or intimidating behavior
   - Hate symbols, nazi imagery, extremist content
   - Bullying scenarios, harassment depictions
   - Gang signs, criminal activity indicators

3. ADULT CONTENT & NUDITY (${CRITICAL_VIOLATIONS.ADULT_CONTENT}):
   - Exposed breasts, genitals, buttocks
   - Sexual poses, suggestive positioning
   - Lingerie, underwear, revealing clothing
   - Sexual acts or implied sexual content
   - Adult toys, sexual paraphernalia
   - Provocative or sexualized imagery

4. HARMFUL & DANGEROUS CONTENT (${CRITICAL_VIOLATIONS.HARMFUL_CONTENT}):
   - Illegal drugs, drug paraphernalia
   - Self-harm activities, cutting, suicide content
   - Dangerous stunts, life-threatening activities
   - Instructions for harmful activities
   - Explosive devices, bomb-making materials
   - Child endangerment scenarios

RESPONSE FORMAT (JSON ONLY):
{
  "status": "failed" | "passed",
  "confidence": 0-100,
  "violation_category": "personal_information" | "violence_harassment" | "adult_content_nudity" | "harmful_dangerous_content" | null,
  "issues": [
    {
      "category": "exact violation category",
      "description": "specific description of what was detected", 
      "severity": "high" | "medium" | "low",
      "confidence": 0-100,
      "blocking_reason": "detailed explanation for blocking"
    }
  ]
}

STRICT GUIDELINES:
- Set status to "failed" for ANY violation with confidence >50%
- Set status to "passed" ONLY if absolutely NO violations detected
- Always err on the side of caution - FALSE POSITIVES are better than missed violations
- Be extremely thorough in analyzing both image content AND caption text
- Any detected violation should result in IMMEDIATE blocking
- Provide detailed blocking reasons for transparency`;

    // Prepare messages for OpenAI GPT-4o Vision
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
            text: `ULTRA-STRICT ANALYSIS REQUIRED - Analyze this content for ANY policy violations:\nFilename: ${filename}\nType: ${type}${caption ? `\nCaption: ${caption}` : ""}\n\nReport ANY detected violations immediately. Zero tolerance policy in effect.`
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
        content: `ULTRA-STRICT ANALYSIS - Examine this content for violations:\n${contentDescription}\n\nZero tolerance policy - block ANY detected violations.`
      });
    }

    console.log("Sending request to OpenAI GPT-4o Vision for STRICT image analysis");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o", // Using GPT-4o for vision capabilities
        messages,
        max_tokens: 800,
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
          severity: "high",
          confidence: 100,
          blocking_reason: "Unable to verify content safety"
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
      if (!result.status) result.status = 'failed'; // Default to blocking for safety
      if (!Array.isArray(result.issues)) result.issues = [];
      
      // ZERO TOLERANCE BLOCKING LOGIC
      if (result.issues && result.issues.length > 0) {
        for (const issue of result.issues) {
          const confidence = issue.confidence || 0;
          
          // Check if it's a critical violation category
          const isCriticalViolation = Object.values(CRITICAL_VIOLATIONS).includes(result.violation_category) ||
                                    issue.category?.toLowerCase().includes('personal') ||
                                    issue.category?.toLowerCase().includes('violence') ||
                                    issue.category?.toLowerCase().includes('adult') ||
                                    issue.category?.toLowerCase().includes('nudity') ||
                                    issue.category?.toLowerCase().includes('harmful') ||
                                    issue.category?.toLowerCase().includes('dangerous');
          
          // Apply confidence-based blocking thresholds
          if (isCriticalViolation || confidence >= BLOCKING_THRESHOLDS.LOW_CONFIDENCE || issue.severity === 'high') {
            result.status = 'failed';
            console.log(`CONTENT BLOCKED - Category: ${issue.category}, Confidence: ${confidence}%, Reason: ${issue.blocking_reason || issue.description}`);
            break;
          }
        }
      }
      
      // Additional safety check - if any violation detected, always block
      if (result.status !== 'failed' && result.issues.length > 0) {
        result.status = 'failed';
        console.log("SAFETY OVERRIDE: Blocking content due to detected violations in zero-tolerance policy");
      }
      
      console.log("Final STRICT moderation result:", JSON.stringify(result));

    } catch (err) {
      console.error("Error parsing AI response:", err, "Raw AI message:", aiMessage);
      // On parsing errors, default to blocking for safety
      result = { 
        status: 'failed',
        confidence: 100,
        violation_category: "system_error",
        issues: [{ 
          category: "Analysis Error", 
          description: "Could not analyze content properly. Upload blocked for safety.", 
          severity: "high",
          confidence: 100,
          blocking_reason: "System unable to verify content safety"
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
});
