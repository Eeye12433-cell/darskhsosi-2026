import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RequestBody {
  url: string;
  language?: 'ar' | 'en';
  educationLevel?: string;
  subject?: string;
  learningStyle?: string;
}

// SSRF Protection: Validate URL before fetching
const ALLOWED_SCHEMES = ['http:', 'https:'];
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254', // AWS metadata
  'metadata.google.internal', // GCP metadata
  'metadata.azure.internal', // Azure metadata
];

const BLOCKED_IP_PATTERNS = [
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^127\./, // 127.0.0.0/8 loopback
  /^0\./, // 0.0.0.0/8
  /^::1$/, // IPv6 loopback
  /^fc00:/, // IPv6 private
  /^fe80:/, // IPv6 link-local
];

function isUrlSafe(urlStr: string): { safe: boolean; reason?: string } {
  try {
    const url = new URL(urlStr);

    // Check scheme
    if (!ALLOWED_SCHEMES.includes(url.protocol)) {
      return { safe: false, reason: 'Only HTTP and HTTPS URLs are allowed' };
    }

    const host = url.hostname.toLowerCase();

    // Check blocked hosts
    if (BLOCKED_HOSTS.includes(host)) {
      return { safe: false, reason: 'This URL target is not allowed' };
    }

    // Check blocked IP patterns
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(host)) {
        return { safe: false, reason: 'Internal network addresses are not allowed' };
      }
    }

    // Block file:// and other dangerous protocols that might bypass the check
    if (url.protocol === 'file:') {
      return { safe: false, reason: 'File URLs are not allowed' };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
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

    const { url, language = 'ar', educationLevel = 'high', learningStyle = 'visual', subject = 'general' }: RequestBody = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SSRF Protection: Validate URL
    const urlValidation = isUrlSafe(url);
    if (!urlValidation.safe) {
      console.warn(`SSRF attempt blocked: ${url} - ${urlValidation.reason}`);
      return new Response(
        JSON.stringify({ error: urlValidation.reason || 'Invalid or blocked URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch the webpage content with timeout
    let pageContent = '';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EducationalBot/1.0)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (pageResponse.ok) {
        const html = await pageResponse.text();
        // Extract text content (basic extraction)
        pageContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 8000); // Limit content size
      }
    } catch (fetchError) {
      console.error('Error fetching URL:', fetchError);
      pageContent = `Unable to fetch content from ${url}. Please analyze based on the URL structure.`;
    }

    const levelContext: Record<string, { ar: string; en: string }> = {
      elementary: { ar: 'بسط المحتوى جداً بأسلوب قصصي مشوق', en: 'Simplify content using an engaging storytelling style' },
      middle: { ar: 'اشرح بوضوح مع التركيز على المفاهيم الأساسية', en: 'Explain clearly focusing on core concepts' },
      high: { ar: 'اشرح بتفصيل أكاديمي مع ربطها بالمنهج', en: 'Explain with academic detail and curriculum links' },
      university: { ar: 'حلل بعمق نقدي واستشهد بالأفكار الجوهرية', en: 'Analyze with critical depth and cite core ideas' },
      professional: { ar: 'قدم تحليلاً استراتيجياً وعملياً متخصصاً', en: 'Provide strategic and practical specialized analysis' }
    };

    const subjectLine = language === 'ar'
      ? `\nالمادة الدراسية الحالية للمتعلم: ${subject}. اربط الشرح والأمثلة بهذه المادة كلما أمكن.`
      : `\nThe learner's current subject is: ${subject}. Connect the explanation and examples to this subject when possible.`;

    const systemPrompt = language === 'ar'
      ? `أنت خبير في "تحليل المحتوى الرقمي" ومعلم ذكي.
مهمتك هي تحليل الرابط وفهمه بعمق ثم شرحه للمتعلم (${educationLevel}).

يرجى اتباع الهيكل التالي في ردك:
1. **الجوهر**: (ملخص في سطرين عن ماهية الموقع/المقال).
2. **النقاط الذهبية**: (أهم 3-5 أفكار تم استخراجها).
3. **لماذا يهمك؟**: (ربط المحتوى بمستوى الطالب ${educationLevel}).
4. **تعمق أكثر**: (شرح مبسط للمفاهيم الصعبة المذكورة).
5. **سؤال للتفكير**: (سؤال واحد يحفز التفكير النقدي حول الموضوع).

رد بتنسيق Markdown جميل ومنظم.`
      : `You are an expert in "Digital Content Analysis" and an intelligent teacher.
Your task is to analyze the link, understand it deeply, and then explain it to the learner (${educationLevel}).

Please follow this structure in your response:
1. **The Essence**: (Two-line summary of what the site/article is about).
2. **Golden Points**: (Top 3-5 ideas extracted).
3. **Why It Matters**: (Connect content to the learner's level: ${educationLevel}).
4. **Dive Deeper**: (Simplified explanation of difficult concepts mentioned).
5. **Thought Provoker**: (One question to stimulate critical thinking about the topic).

Respond in beautiful and organized Markdown format.`;

    const userPrompt = language === 'ar'
      ? `قم بتحليل وشرح محتوى هذا الموقع:
URL: ${url}

المحتوى المستخرج:
${pageContent}

قدم ملخصاً شاملاً يتضمن:
- الفكرة الرئيسية
- النقاط المهمة
- المفاهيم الجديدة
- كيف يمكن الاستفادة من هذا المحتوى تعليمياً`
      : `Analyze and explain the content of this website:
URL: ${url}

Extracted content:
${pageContent}

Provide a comprehensive summary including:
- Main idea
- Important points
- New concepts
- How this content can be used educationally`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
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
      throw new Error('Failed to explain link');
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ explanation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in explain-link:', error);
    // Return generic error to client, keep details in server logs
    return new Response(
      JSON.stringify({ error: 'Unable to analyze the link. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
