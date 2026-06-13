import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB

const AnalysisSchema = z.object({
  itemName: z.string(),
  brand: z.string(),
  model: z.string(),
  category: z.string(),
  condition: z.enum(["New", "Like New", "Good", "Fair", "Poor"]),
  conditionNotes: z.string(),
  keySpecs: z.array(z.object({ key: z.string(), value: z.string() })),
  suggestedTitle: z.string().max(80),
  description: z.string(),
  suggested_price_low: z.number(),
  suggested_price_high: z.number(),
  price_rationale: z.string(),
  search_terms: z.string(),
  identification_confidence: z.enum(["high", "medium", "low"]),
  missing_info: z.array(z.string()),
});

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Origin header validation
  const origin = req.headers.get("Origin");
  if (!origin) {
    return new Response(
      JSON.stringify({ error: "Origin header is required" }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Max body size check
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return new Response(
        JSON.stringify({ error: "Request body too large (max 2MB)" }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    // Additional body size guard after parsing
    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > MAX_BODY_BYTES) {
      return new Response(
        JSON.stringify({ error: "Request body too large (max 2MB)" }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageBase64, voiceNote } = body;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are an expert eBay seller. Analyze this image and return ONLY valid JSON with these exact fields:
{
  "itemName": "string - common name of the item",
  "brand": "string - brand name or 'Unknown'",
  "model": "string - model name/number or 'Unknown'",
  "category": "string - best eBay Suggested Category",
  "condition": "New|Like New|Good|Fair|Poor",
  "conditionNotes": "string - any visible wear, damage, or notable condition details",
  "keySpecs": [{"key": "string", "value": "string"}],
  "suggestedTitle": "string - compelling eBay title max 80 chars",
  "description": "string - 3-4 sentence eBay description, mention condition, key features",
  "suggested_price_low": number,
  "suggested_price_high": number,
  "price_rationale": "string - brief reason for the price estimate (1-2 sentences)",
  "search_terms": "string - clean search query: brand + model + item type, no noise words",
  "identification_confidence": "high|medium|low",
  "missing_info": ["string - detail that would improve accuracy"]
}${voiceNote ? `\nAdditional seller notes: "${voiceNote}" - incorporate into description and condition notes.` : ''}

Return ONLY the JSON object. No markdown, no backticks, no explanation.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ebay-snap-lister.app",
        "X-Title": "eBay Snap Lister",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", errorText);
      return new Response(
        JSON.stringify({ error: `OpenRouter API error: ${response.status}`, details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content in AI response" }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response (strip potential markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const rawListing = JSON.parse(jsonStr);

    // Zod validation
    const parseResult = AnalysisSchema.safeParse(rawListing);
    if (!parseResult.success) {
      console.error("Zod validation failed:", parseResult.error);
      return new Response(
        JSON.stringify({ error: "AI response did not match expected schema", details: parseResult.error.flatten() }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(parseResult.data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
