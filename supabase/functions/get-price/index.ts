import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  searchQuery: string;
}

interface eBayItem {
  price?: {
    value?: string;
    currency?: string;
  };
  itemWebUrl?: string;
}

interface eBaySearchResponse {
  itemSummaries?: eBayItem[];
  total?: number;
}

async function getEbayToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`eBay OAuth error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EBAY_CLIENT_ID = Deno.env.get("EBAY_CLIENT_ID");
    const EBAY_CLIENT_SECRET = Deno.env.get("EBAY_CLIENT_SECRET");

    if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "eBay credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { searchQuery }: RequestBody = await req.json();

    if (!searchQuery) {
      return new Response(
        JSON.stringify({ error: "searchQuery is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get eBay OAuth token
    const token = await getEbayToken(EBAY_CLIENT_ID, EBAY_CLIENT_SECRET);

    // Search eBay Browse API
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&LH_BIN=1`;
    const apiUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodedQuery}&limit=20&filter=buyingOptions:{FIXED_PRICE}`;

    const searchResponse = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("eBay search error:", errorText);
      return new Response(
        JSON.stringify({ 
          error: `eBay search failed: ${searchResponse.status}`,
          activeListings: 0,
          lowestPrice: 0,
          averagePrice: 0,
          currency: "USD",
          searchUrl,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData: eBaySearchResponse = await searchResponse.json();
    const items = searchData.itemSummaries ?? [];

    // Extract and calculate prices
    const prices: number[] = items
      .map((item) => parseFloat(item.price?.value ?? '0'))
      .filter((price) => price > 0);

    const activeListings = prices.length;
    const lowestPrice = activeListings > 0 ? Math.min(...prices) : 0;
    const averagePrice =
      activeListings > 0
        ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
        : 0;
    const currency = items[0]?.price?.currency ?? "USD";

    return new Response(
      JSON.stringify({
        activeListings,
        lowestPrice: Math.round(lowestPrice * 100) / 100,
        averagePrice,
        currency,
        searchUrl,
      }),
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
