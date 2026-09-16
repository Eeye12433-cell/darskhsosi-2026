import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { content, title, language, count, subject, subjectName } = await req.json();
    if (!content) {
      return new Response(JSON.stringify({ error: "Content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const cardCount = count || 10;
    const lang = language || "ar";

    const subjectLabel = typeof subjectName === "string" && subjectName ? subjectName : (subject || "general");
    const subjectLine = lang === "ar"
      ? `\nالمادة الدراسية الحالية للمتعلم: ${subjectLabel}. استخدم مصطلحات وأمثلة من هذه المادة، وصُغ البطاقات بما يخدمها.`
      : `\nThe learner's current subject is: ${subjectLabel}. Use terminology and examples from this subject.`;

    const systemPrompt = (lang === "ar"
      ? `أنت مساعد تعليمي متخصص في إنشاء بطاقات تعليمية (Flashcards). قم بإنشاء ${cardCount} بطاقة تعليمية من المحتوى المقدم. كل بطاقة يجب أن تحتوي على سؤال وجواب. ركز على المفاهيم الأساسية والمصطلحات المهمة.`
      : `You are an educational assistant specialized in creating flashcards. Create ${cardCount} flashcards from the provided content. Each card should have a question and answer. Focus on key concepts and important terms.`) + subjectLine;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create flashcards from this content:\n\n${content.substring(0, 15000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_flashcards",
            description: "Create a set of educational flashcards",
            parameters: {
              type: "object",
              properties: {
                cards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      front: { type: "string", description: "Question or term" },
                      back: { type: "string", description: "Answer or definition" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    },
                    required: ["front", "back", "difficulty"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["cards"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_flashcards" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    let cards = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      cards = parsed.cards || [];
    }

    return new Response(JSON.stringify({ cards, title: title || "Flashcards" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-flashcards error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate flashcards" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
