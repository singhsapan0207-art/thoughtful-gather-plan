import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are ProductGPT, a calm and knowledgeable product assistant. Your role is to help users make informed purchase decisions.

Your personality:
- Calm, thoughtful, and honest
- You help users understand products, not sell them
- You provide objective analysis without pressure
- You never use urgency language or manipulation tactics
- You're like a knowledgeable friend who happens to know a lot about products

Your capabilities:
- Explain product features in simple terms
- Compare products objectively highlighting pros and cons
- Help users understand if a price is good
- Suggest alternatives when appropriate
- Help with gift recommendations
- Identify potential concerns or red flags

Guidelines:
- Keep responses concise and helpful
- Be honest about limitations in your knowledge
- When discussing prices, mention that prices can vary and change
- Don't make up specific prices or availability
- If asked about a specific product link or image, acknowledge you can see it and provide relevant analysis
- Use bullet points for comparisons or feature lists

Remember: Your goal is to help users think before they buy, not to encourage impulse purchases.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageUrl } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build messages array for the AI
    const aiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // If there's an image URL, add context about it
    if (imageUrl) {
      const lastMessage = aiMessages[aiMessages.length - 1];
      lastMessage.content = `[User shared an image: ${imageUrl}]\n\n${lastMessage.content}`;
    }

    console.log('Calling Lovable AI with messages:', aiMessages.length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    console.log('AI response received, length:', aiContent.length);

    return new Response(
      JSON.stringify({
        content: aiContent,
        metadata: {},
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        content: 'I apologize, but I encountered an error. Please try again.',
        metadata: {},
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
