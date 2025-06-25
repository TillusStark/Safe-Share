
import { ModerationRequest, ModerationResult, ModerationIssue, CRITICAL_VIOLATIONS, BLOCKING_THRESHOLDS } from "./types.ts";
import { createSystemPrompt, createUserPrompt } from "./prompts.ts";

export async function analyzeContent(
  request: ModerationRequest,
  openAIApiKey: string
): Promise<ModerationResult> {
  const { filename, type, caption, imageData } = request;

  console.log("Processing ZERO-TOLERANCE moderation check for:", filename);

  // Prepare messages for OpenAI GPT-4o Vision
  const messages = [
    { role: "system", content: createSystemPrompt() }
  ];

  // Add image analysis if image data is provided
  if (imageData) {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: createUserPrompt(filename, type, caption)
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
    messages.push({
      role: "user",
      content: createUserPrompt(filename, type, caption)
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
    throw new Error("OpenAI API request failed");
  }

  const json = await response.json();
  console.log("Raw OpenAI response:", JSON.stringify(json));

  let aiMessage = json.choices?.[0]?.message?.content?.trim();
  console.log("AI moderation result:", aiMessage);

  return parseAIResponse(aiMessage);
}

function parseAIResponse(aiMessage: string): ModerationResult {
  let result: ModerationResult;
  
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
        const isCriticalViolation = Object.values(CRITICAL_VIOLATIONS).includes(result.violation_category as any) ||
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
    return result;

  } catch (err) {
    console.error("Error parsing AI response:", err, "Raw AI message:", aiMessage);
    // On parsing errors, default to blocking for safety
    return { 
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
}
