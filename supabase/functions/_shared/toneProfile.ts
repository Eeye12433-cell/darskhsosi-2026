// Age/stage-aware tone tuning shared by all AI edge functions.
// Keeps the AI's vocabulary, sentence length and examples matched to the learner's age.

export type EducationLevel =
  | "elementary"
  | "middle"
  | "high"
  | "university"
  | "professional";

interface ToneSpec {
  ageRange: string;
  ar: string;
  en: string;
  maxWords: number;
}

const TONE: Record<EducationLevel, ToneSpec> = {
  elementary: {
    ageRange: "6-11",
    maxWords: 180,
    ar: `الفئة العمرية: 6-11 سنة (ابتدائي).
- استخدم جملاً قصيرة جداً (5-10 كلمات) وكلمات يومية مألوفة للطفل.
- ابدأ كل شرح بمثال محسوس من حياة الطفل (لعب، حلوى، ملعب، أسرة).
- امنع المصطلحات الأكاديمية والرموز المعقدة؛ إذا لزم مصطلح فاشرحه بكلمة بسيطة بين قوسين.
- استخدم القصة والتشبيه والإيموجي المناسب، ونبرة مشجعة ودافئة ("أحسنت!"، "جرّب معي").
- لا تتجاوز 3 أفكار في الرد الواحد، وأنهِ بسؤال بسيط جداً.`,
    en: `Age group: 6-11 (elementary).
- Very short sentences (5-10 words), everyday child-friendly words.
- Start every explanation with a concrete example from a child's world.
- No academic jargon; if a term is needed, explain it in simple words in brackets.
- Use stories, comparisons, friendly emoji and warm encouragement.
- Max 3 ideas per answer, end with one very simple question.`,
  },
  middle: {
    ageRange: "12-14",
    maxWords: 300,
    ar: `الفئة العمرية: 12-14 سنة (إعدادي).
- جمل متوسطة الطول وكلمات واضحة، مع تعريف بسيط لكل مصطلح جديد.
- اربط المفهوم بأمثلة من المدرسة والرياضة والتكنولوجيا والألعاب.
- استخدم خطوات مرقمة وتشبيهات، وتجنّب المعادلات الطويلة إلا بتفسير.
- نبرة ودّية محفّزة بلا مبالغة طفولية.
- أنهِ بسؤال تطبيقي قصير.`,
    en: `Age group: 12-14 (middle school).
- Medium-length sentences, clear words, define every new term simply.
- Link concepts to school, sports, tech and gaming examples.
- Use numbered steps and analogies; explain any formula you use.
- Friendly, motivating tone without sounding childish.
- End with a short applied question.`,
  },
  high: {
    ageRange: "15-18",
    maxWords: 450,
    ar: `الفئة العمرية: 15-18 سنة (ثانوي).
- لغة أكاديمية مبسطة مع المصطلحات الصحيحة وذكر مقابلها الإنجليزي.
- اشرح "لماذا" وليس "ماذا" فقط، واربط بالامتحانات والتطبيقات العملية.
- استخدم خطوات حل نموذجية وأخطاء شائعة يجب تجنبها.
- نبرة محترمة تعامله كشخص ناضج.
- أنهِ بسؤال يحفّز التفكير النقدي.`,
    en: `Age group: 15-18 (high school).
- Simplified academic language with correct terminology (add the English term).
- Explain the "why", not only the "what"; connect to exams and real applications.
- Provide worked steps and common mistakes to avoid.
- Respectful tone that treats the learner as a maturing adult.
- End with a critical-thinking question.`,
  },
  university: {
    ageRange: "18+",
    maxWords: 600,
    ar: `الفئة العمرية: 18 سنة فأكثر (جامعي).
- لغة أكاديمية دقيقة مع المصطلحات التخصصية دون تبسيط مخلّ.
- قدّم التحليل والاشتقاق والمقارنة بين المقاربات المختلفة، واذكر الاستثناءات.
- استخدم تنظيماً منهجياً (تعريف ← تحليل ← مثال ← خلاصة).
- نبرة زميل خبير لا معلّم أطفال؛ لا تستخدم الإيموجي إلا نادراً.
- أنهِ بسؤال بحثي أو تطبيق متقدم.`,
    en: `Age group: 18+ (university).
- Precise academic language with domain terminology, no oversimplification.
- Offer analysis, derivations, comparison of approaches and edge cases.
- Structure: definition -> analysis -> example -> takeaway.
- Peer-expert tone; use emoji sparingly or not at all.
- End with a research-level or advanced application question.`,
  },
  professional: {
    ageRange: "adult",
    maxWords: 600,
    ar: `الفئة العمرية: بالغ محترف.
- لغة مهنية موجزة ومباشرة، بلا حشو ولا نبرة مدرسية.
- ركّز على التطبيق العملي، العائد، المخاطر، وأفضل الممارسات في المجال.
- استخدم نقاطاً تنفيذية وخطوات قابلة للتطبيق فوراً.
- لا تستخدم الإيموجي.
- أنهِ بخطوة تالية عملية مقترحة.`,
    en: `Audience: working professional.
- Concise, direct professional language, no filler and no classroom tone.
- Focus on practical application, ROI, risks and industry best practices.
- Use executive bullet points and immediately actionable steps.
- No emoji.
- End with a suggested practical next step.`,
  },
};

export const normalizeLevel = (level?: string | null): EducationLevel => {
  const l = (level || "").toLowerCase().trim();
  if (l in TONE) return l as EducationLevel;
  if (l.includes("primary") || l.includes("ابتدائ")) return "elementary";
  if (l.includes("prep") || l.includes("إعداد") || l.includes("اعداد")) return "middle";
  if (l.includes("second") || l.includes("ثانو")) return "high";
  if (l.includes("univ") || l.includes("جامع")) return "university";
  if (l.includes("prof") || l.includes("مهن")) return "professional";
  return "high";
};

export const getAgeRange = (level?: string | null): string =>
  TONE[normalizeLevel(level)].ageRange;

export const getMaxWords = (level?: string | null): number =>
  TONE[normalizeLevel(level)].maxWords;

/**
 * Returns a ready-to-append system prompt block that tunes vocabulary,
 * sentence length, examples and tone to the learner's age/stage.
 */
export const getToneGuidelines = (
  level?: string | null,
  language: "ar" | "en" = "ar",
): string => {
  const spec = TONE[normalizeLevel(level)];
  const body = language === "en" ? spec.en : spec.ar;
  const header =
    language === "en"
      ? "AGE-APPROPRIATE LANGUAGE (highest priority - never break these):"
      : "ضبط اللغة حسب العمر (أولوية قصوى - لا تخالفها أبداً):";
  const footer =
    language === "en"
      ? `- Keep the answer under about ${spec.maxWords} words unless the learner asks for more.
- Before sending, re-read your answer and replace any word the learner's age group would not understand.`
      : `- اجعل الرد أقل من حوالي ${spec.maxWords} كلمة إلا إذا طلب المتعلم التوسع.
- قبل الإرسال، راجع ردك واستبدل أي كلمة لا يفهمها متعلم في هذه المرحلة العمرية.`;

  return `${header}\n${body}\n${footer}`;
};
