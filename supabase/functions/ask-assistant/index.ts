import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, items } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const itemsList = (items || [])
      .map(
        (item: any, i: number) =>
          `${i + 1}. "${item.name}" | חדר: ${item.room || "לא הוגדר"} | קטגוריה: ${item.category || "לא הוגדר"} | מחיר: ${item.purchase_price ? "₪" + item.purchase_price : "לא הוגדר"} | תאריך רכישה: ${item.purchase_date || "לא הוגדר"} | אחריות עד: ${item.warranty_end_date || "לא הוגדר"} | טלפון שירות: ${item.phone || "לא הוגדר"} | הוראות: ${item.manual_url || "אין"} | הערות: ${item.notes || "אין"} | מזהה: ${item.id}`
      )
      .join("\n");

    const systemPrompt = `אתה עוזר חכם למערכת ניהול מוצרי בית. להלן רשימת המוצרים של המשתמש/ת:

${itemsList}

כללים:
- ענה בעברית, בקצרה ובבהירות
- אם השאלה מתייחסת למוצר ספציפי, תן מידע רלוונטי
- אם יש כמה מוצרים שיכולים להתאים לשאלה ולא ברור לאיזה, תחזיר את התשובה עם רשימת המוצרים האפשריים בפורמט JSON מיוחד
- כשאתה מציין מוצרים אפשריים, הוסף בסוף התשובה שורה מיוחדת: [ITEMS:id1,id2,id3] עם המזהים
- אם השאלה לא קשורה למוצרים, ענה בנימוס שאתה עוזר רק לשאלות על מוצרי הבית
- התאריך היום: ${new Date().toISOString().split("T")[0]}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests, try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ask-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
