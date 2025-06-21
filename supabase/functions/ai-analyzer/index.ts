
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  type: 'comment' | 'story';
  content: string;
  context?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, context }: AnalysisRequest = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    if (type === 'comment') {
      systemPrompt = `You are an AI content analyst. Analyze the following comment and provide:
1. Sentiment analysis (positive, negative, neutral with confidence score)
2. Content moderation flags (inappropriate, spam, harassment)
3. Key topics or themes mentioned
4. Engagement prediction (high, medium, low)
5. Brief summary of the comment's intent

Respond in JSON format with clear, actionable insights.`;
    } else if (type === 'story') {
      systemPrompt = `You are an AI content analyst for social media stories. Analyze the story content and provide:
1. Content type classification (lifestyle, professional, entertainment, etc.)
2. Engagement prediction based on visual elements
3. Optimal posting time recommendations
4. Audience targeting suggestions
5. Content quality assessment

Respond in JSON format with practical recommendations.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Content: ${content}${context ? `\nContext: ${context}` : ''}` }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: analysis,
      type: type 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI analyzer:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
