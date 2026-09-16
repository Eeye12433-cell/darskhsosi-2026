import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitizeApiBaseUrl } from "../_shared/safeApiUrl.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RequestBody {
  imageBase64: string;
  prompt?: string;
  language?: 'ar' | 'en';
  educationLevel?: string;
  subject?: string;
  mode?: 'analyze' | 'extract'; // New mode for pure text extraction
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log("Authenticated user:", userId);

    // Fetch user profile for personal API keys
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await serviceClient
      .from('user_api_credentials')
      .select('gemini_api_key, openai_api_key, custom_api_key, custom_base_url, custom_model')
      .eq('user_id', userId)
      .maybeSingle();

    let apiKey = Deno.env.get('LOVABLE_API_KEY');

    let apiBaseUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
    let model = 'google/gemini-3-flash-preview';

    // Priority 1: User's Custom key
    if (profile?.custom_api_key) {
      apiKey = profile.custom_api_key;
      apiBaseUrl = sanitizeApiBaseUrl(profile.custom_base_url, 'https://api.openai.com/v1/chat/completions');
      model = profile.custom_model || 'gpt-4o-mini';
      console.log('Using personal Custom API key for analysis');
    }
    // Priority 2: User's Gemini key
    else if (profile?.gemini_api_key) {
      apiKey = profile.gemini_api_key;
      apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/chat/completions';
      model = 'gemini-2.0-flash';
      console.log('Using user provided Gemini API key for analysis');
    }
    // Priority 3: User's OpenAI key
    else if (profile?.openai_api_key) {
      apiKey = profile.openai_api_key;
      apiBaseUrl = 'https://api.openai.com/v1/chat/completions';
      model = 'gpt-4o';
      console.log('Using user provided OpenAI API key for analysis');
    }

    if (!apiKey) {
      console.error('No API key found (LOVABLE_API_KEY or user key)');
      return new Response(
        JSON.stringify({
          error: 'AI Analysis not configured. Please add your Gemini API key in your Profile to enable this feature.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      imageBase64,
      prompt,
      language = 'ar',
      educationLevel = 'high',
      subject = 'general',
      mode = 'analyze'
    }: RequestBody = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced OCR extraction mode
    if (mode === 'extract') {
      const extractionPrompt = language === 'ar'
        ? `أنت متخصص في استخراج النصوص من الصور بدقة عالية.
+
+قواعد الاستخراج:
+1. استخرج كل كلمة وحرف ورقم ورمز كما يظهر بالضبط
+2. حافظ على ترتيب القراءة الصحيح (من اليمين لليسار للعربية)
+3. حافظ على التشكيل والحركات إن وجدت
+4. للجداول: استخدم تنسيق markdown
+5. للمعادلات: استخدم رموز LaTeX
+6. للنص المكتوب بخط اليد: حاول استخراجه بأفضل دقة ممكنة
+7. لا تترجم أو تلخص - استخرج النص كما هو
+
+أعد النص المستخرج فقط بدون أي تعليقات.`
        : `You are a precision OCR text extraction specialist.
+
+EXTRACTION RULES:
+1. Extract EVERY word, character, number, and symbol exactly as shown
+2. Preserve correct reading order
+3. For tables: use markdown table format
+4. For equations: use LaTeX notation
+5. For handwritten text: extract with best accuracy, mark uncertain with [?]
+6. Preserve Arabic diacritics (تشكيل) if present
+7. Do NOT translate or summarize - extract verbatim
+
+Return ONLY the extracted text without any commentary.`;

      const response = await fetch(apiBaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: extractionPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt || (language === 'ar' ? 'استخرج كل النص من هذه الصورة' : 'Extract all text from this image') },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 16000,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        throw new Error('Failed to extract text from image');
      }

      const data = await response.json();
      const extractedText = data.choices?.[0]?.message?.content || '';

      return new Response(
        JSON.stringify({ analysis: extractedText, mode: 'extract' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Standard analysis mode with enhanced prompts
    const levelPrompts: Record<string, { ar: string; en: string }> = {
      elementary: { ar: 'اشرح بطريقة بسيطة جداً مناسبة لطالب ابتدائي', en: 'Explain very simply for an elementary student' },
      middle: { ar: 'اشرح بوضوح لطالب متوسط', en: 'Explain clearly for a middle school student' },
      high: { ar: 'اشرح بشكل مفصل لطالب ثانوي', en: 'Explain in detail for a high school student' },
      university: { ar: 'اشرح بعمق أكاديمي لطالب جامعي', en: 'Explain with academic depth for a university student' },
      professional: { ar: 'اشرح بشكل متخصص ومتقدم', en: 'Explain in a specialized and advanced way' }
    };

    const levelPrompt = levelPrompts[educationLevel]?.[language] || levelPrompts.high[language];

    const systemPrompt = language === 'ar'
      ? `أنت معلم ذكي متخصص في تحليل الصور التعليمية والمسائل العلمية.
${levelPrompt}

عند تحليل صورة:
1. اقرأ واستخرج كل النص والأرقام والرموز بدقة أولاً
2. حدد نوع المسألة أو المحتوى (رياضيات، فيزياء، كيمياء، إلخ)
3. اشرح المفاهيم الموجودة في الصورة
4. إذا كانت مسألة، قم بحلها خطوة بخطوة مع إظهار كل العمليات
5. قدم نصائح للفهم والتطبيق
6. اذكر أي أخطاء شائعة يجب تجنبها
7. للنص المكتوب بخط اليد: اقرأه بعناية واستخرجه بدقة

استخدم الرموز الرياضية بشكل صحيح (LaTeX إن أمكن) واجعل الشرح واضحاً ومنظماً.`
      : `You are an intelligent tutor specialized in analyzing educational images and scientific problems.
${levelPrompt}

When analyzing an image:
1. First, accurately read and extract ALL text, numbers, and symbols
2. Identify the type of problem or content (math, physics, chemistry, etc.)
3. Explain the concepts present in the image
4. If it's a problem, solve it step by step showing all work
5. Provide tips for understanding and application
6. Mention any common mistakes to avoid
7. For handwritten text: carefully read and extract it accurately

Use mathematical symbols correctly (LaTeX when applicable) and make the explanation clear and organized.`;

    const userPrompt = prompt || (language === 'ar'
      ? 'حلل هذه الصورة واشرح محتواها بالتفصيل. اقرأ كل النص المكتوب بدقة. إذا كانت تحتوي على مسألة، قم بحلها خطوة بخطوة.'
      : 'Analyze this image and explain its content in detail. Read all written text accurately. If it contains a problem, solve it step by step.');

    const response = await fetch(apiBaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 16000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Failed to analyze image');
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-image:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to analyze the image. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
