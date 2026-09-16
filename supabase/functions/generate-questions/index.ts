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
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const topic = typeof body.topic === "string" ? body.topic.slice(0, 300) : "";
    const content = typeof body.content === "string" ? body.content.slice(0, 15000) : "";
    const subject = typeof body.subject === "string" ? body.subject : "general";
    const subjectName = typeof body.subjectName === "string" ? body.subjectName : subject;
    const lang = body.language === "en" ? "en" : "ar";
    const difficulty = ["easy", "medium", "hard"].includes(body.difficulty) ? body.difficulty : "medium";
    const count = Math.min(Math.max(Number(body.count) || 5, 1), 15);
    const level = typeof body.educationLevel === "string" ? body.educationLevel : "";

    if (!topic && !content) {
      return new Response(JSON.stringify({ error: "Topic or content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = lang === "ar"
      ? `أنت خبير في بناء بنوك الأسئلة التعليمية. أنشئ ${count} سؤال اختيار من متعدد (4 اختيارات لكل سؤال) في مادة "${subjectName}"${level ? ` للمرحلة الدراسية: ${level}` : ""} بمستوى صعوبة ${difficulty}. اكتب الأسئلة والاختيارات والشرح باللغة العربية الفصحى الواضحة، واجعل الشرح مختصرًا ومفيدًا، وتأكد أن إجابة واحدة فقط صحيحة.`
      : `You are an expert in building educational question banks. Create ${count} multiple-choice questions (4 options each) for the subject "${subjectName}"${level ? `, education level: ${level}` : ""} at ${difficulty} difficulty. Provide a concise useful explanation and ensure exactly one correct answer.`;

    const userPrompt = content
      ? `${lang === "ar" ? "أنشئ الأسئلة من هذا المحتوى" : "Create questions from this content"}:\n\n${content}`
      : `${lang === "ar" ? "الموضوع" : "Topic"}: ${topic}`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_questions",
            description: "Create multiple-choice questions",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      options: { type: "array", items: { type: "string" } },
                      correct_index: { type: "number" },
                      explanation: { type: "string" },
                      topic: { type: "string" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    },
                    required: ["question", "options", "correct_index", "explanation", "topic", "difficulty"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_questions" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error("AI gateway error:", status, await response.text());
      if (status === 429) {
        return new Response(JSON.stringify({ error: "rate_limit" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "payment_required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let questions: any[] = [];
    if (call?.function?.arguments) {
      try {
        questions = JSON.parse(call.function.arguments)?.questions ?? [];
      } catch (_e) {
        const match = String(call.function.arguments).match(/\{[\s\S]*\}/);
        if (match) questions = JSON.parse(match[0])?.questions ?? [];
      }
    }

    questions = (questions || [])
      .filter((q) => q && typeof q.question === "string" && Array.isArray(q.options) && q.options.length >= 2)
      .map((q) => ({
        question: String(q.question),
        options: q.options.slice(0, 6).map((o: unknown) => String(o)),
        correct_index: Math.min(Math.max(Number(q.correct_index) || 0, 0), q.options.length - 1),
        explanation: typeof q.explanation === "string" ? q.explanation : "",
        topic: typeof q.topic === "string" && q.topic ? q.topic : (topic || subjectName),
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : difficulty,
        subject,
      }));

    if (questions.length === 0) throw new Error("No questions generated");

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-questions error:", error);
    return new Response(JSON.stringify({ error: "generation_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
