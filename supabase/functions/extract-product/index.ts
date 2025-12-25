import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Extracting product from:", url);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You extract product information from URLs. Return JSON only with these fields:
- name: product name (string)
- price: numeric price without currency symbols (number or null)
- currency: currency code like INR, USD (string, default INR)
- image_url: product image URL if found (string or null)
- retailer: retailer name like Amazon, Flipkart (string or null)

Example: {"name": "Sony WH-1000XM5", "price": 29990, "currency": "INR", "image_url": null, "retailer": "Amazon"}`
          },
          {
            role: "user",
            content: `Extract product info from this URL: ${url}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_product",
            description: "Extract product details from URL",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" },
                currency: { type: "string" },
                image_url: { type: "string" },
                retailer: { type: "string" }
              },
              required: ["name"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_product" } }
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI error:", response.status, text);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI request failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No product data extracted");
    }

    const productData = JSON.parse(toolCall.function.arguments);
    console.log("Extracted:", productData);

    return new Response(JSON.stringify(productData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
