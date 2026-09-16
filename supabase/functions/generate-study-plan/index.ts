import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Material {
  name: string;
  content: string;
}

interface RequestBody {
  materials: Material[];
  subject?: string;
  educationLevel?: string;
  learningStyle?: string;
  durationWeeks?: number;
  language?: 'ar' | 'en';
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

    const {
      materials,
      subject = 'general',
      educationLevel = 'high',
      learningStyle = 'visual',
      durationWeeks = 2,
      language = 'ar'
    }: RequestBody = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const subjectNames: Record<string, { ar: string; en: string }> = {
      physics: { ar: 'الفيزياء', en: 'Physics' },
      chemistry: { ar: 'الكيمياء', en: 'Chemistry' },
      math: { ar: 'الرياضيات', en: 'Mathematics' },
      biology: { ar: 'الأحياء', en: 'Biology' },
      history: { ar: 'التاريخ', en: 'History' },
      arabic: { ar: 'اللغة العربية', en: 'Arabic' },
      english: { ar: 'اللغة الإنجليزية', en: 'English' },
      general: { ar: 'عام', en: 'General' }
    };

    const subjectName = subjectNames[subject]?.[language] || subjectNames.general[language];

    const materialsContext = materials
      .map(m => `📄 ${m.name}:\n${m.content}`)
      .join('\n\n');

    const systemPrompt = language === 'ar'
      ? `أنت خبير في التخطيط التربوي وتصميم المناهج الرقمية.
مهمتك هي تحويل المحتوى التعليمي إلى خطة دراسية استراتيجية، جذابة، وعملية.

يجب أن تتبع الخطة المنهجية التالية:
1. التدرج من السهل إلى الصعب.
2. مراعاة أسلوب التعلم المفضل للمتعلم (${learningStyle}).
3. تقسيم المحتوى إلى وحدات زمنية منطقية.

يجب أن ترد بتنسيق JSON فقط بالشكل التالي:
{
  "title": "عنوان جذاب للخطة",
  "overview": "ملخص شامل للأهداف التعليمية",
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "الهدف الرئيسي لهذا الأسبوع",
      "days": [
        {
          "day": "اليوم",
          "topics": ["موضوعات فرعية محددة"],
          "duration": "الوقت الموصى به (مثلاً: 45 دقيقة)",
          "activities": ["أنشطة عملية تطبيقية"]
        }
      ]
    }
  ],
  "tips": ["نصائح ذهبية لتسريع التعلم والاستيعاب"]
}`
      : `You are an expert in educational planning and digital curriculum design.
Your task is to transform educational content into a strategic, engaging, and practical study plan.

The plan must follow this methodology:
1. Progressive difficulty (simple to complex).
2. Alignment with the learner's preferred style (${learningStyle}).
3. Logical content breakdown into time units.

You must respond in JSON format only as follows:
{
  "title": "Engaging Plan Title",
  "overview": "Comprehensive summary of learning goals",
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Main objective for this week",
      "days": [
        {
          "day": "Day",
          "topics": ["Specific sub-topics"],
          "duration": "Recommended time (e.g., 45 mins)",
          "activities": ["Practical application activities"]
        }
      ]
    }
  ],
  "tips": ["Pro-tips for faster learning and retention"]
}`;

    const userPrompt = language === 'ar'
      ? `أنشئ خطة دراسية لمدة ${durationWeeks} ${durationWeeks === 1 ? 'أسبوع' : 'أسابيع'} للمادة: ${subjectName}

المستوى التعليمي: ${educationLevel}
أسلوب التعلم المفضل: ${learningStyle}

المواد التعليمية المتاحة:
${materialsContext || 'لا توجد مواد محددة - أنشئ خطة عامة'}

أنشئ خطة دراسية تتضمن:
- جدول يومي واقعي
- توزيع المواضيع بشكل متوازن
- أنشطة متنوعة حسب أسلوب التعلم
- فترات راحة ومراجعة
- نصائح للنجاح`
      : `Create a study plan for ${durationWeeks} week${durationWeeks > 1 ? 's' : ''} for subject: ${subjectName}

Education level: ${educationLevel}
Preferred learning style: ${learningStyle}

Available study materials:
${materialsContext || 'No specific materials - create a general plan'}

Create a study plan that includes:
- Realistic daily schedule
- Balanced topic distribution
- Various activities based on learning style
- Rest and review periods
- Tips for success`;

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
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Failed to generate study plan');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let plan = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing plan JSON:', parseError);
    }

    return new Response(
      JSON.stringify({ plan, rawContent: content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-study-plan:', error);
    // Return generic error to client, keep details in server logs
    return new Response(
      JSON.stringify({ error: 'Unable to generate study plan. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
