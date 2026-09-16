import React from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';
import { getSubjectTheme } from '@/utils/subjectColors';

interface SmartSuggestionsProps {
  language: 'ar' | 'en';
  personaId: string;
  subject?: string;
  onSuggestionClick: (suggestion: string) => void;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  language,
  personaId,
  subject = 'general',
  onSuggestionClick
}) => {
  const subjectTheme = getSubjectTheme(subject);
  const subjectName = language === 'ar' ? subjectTheme.nameAr : subjectTheme.nameEn;
  const getSuggestions = (): { ar: string; en: string }[] => {
    const suggestions: Record<string, { ar: string; en: string }[]> = {
      teacher: [
        { ar: 'اشرح لي هذا المفهوم بطريقة أبسط', en: 'Explain this concept in a simpler way' },
        { ar: 'أعطني أمثلة عملية', en: 'Give me practical examples' },
        { ar: 'ما هي النقاط الرئيسية؟', en: 'What are the key points?' },
        { ar: 'كيف يرتبط هذا بما تعلمته سابقاً؟', en: 'How does this relate to what I learned before?' },
      ],
      mindmap: [
        { ar: 'أنشئ خريطة ذهنية للموضوع', en: 'Create a mind map for the topic' },
        { ar: 'أضف المزيد من الفروع', en: 'Add more branches' },
        { ar: 'اشرح العلاقات بين المفاهيم', en: 'Explain relationships between concepts' },
        { ar: 'بسّط الخريطة', en: 'Simplify the map' },
      ],
      simplify: [
        { ar: 'بسّط أكثر من فضلك', en: 'Simplify more please' },
        { ar: 'أعطني مثالاً من الحياة اليومية', en: 'Give me an everyday example' },
        { ar: 'كأنك تشرح لطفل', en: 'As if explaining to a child' },
        { ar: 'ما هو التشبيه المناسب؟', en: 'What is an appropriate analogy?' },
      ],
      summary: [
        { ar: 'لخّص في نقاط', en: 'Summarize in points' },
        { ar: 'اختصر أكثر', en: 'Make it shorter' },
        { ar: 'أضف المزيد من التفاصيل', en: 'Add more details' },
        { ar: 'ما هي الأفكار الرئيسية؟', en: 'What are the main ideas?' },
      ],
      scientist: [
        { ar: 'كيف اكتشفتم هذا؟', en: 'How did you discover this?' },
        { ar: 'ما هي التجارب المتعلقة؟', en: 'What are the related experiments?' },
        { ar: 'ما هي التطبيقات العملية؟', en: 'What are practical applications?' },
        { ar: 'ما هي التحديات الحالية؟', en: 'What are current challenges?' },
      ],
      test: [
        { ar: 'اختبرني في هذا الموضوع', en: 'Test me on this topic' },
        { ar: 'أعطني أسئلة أصعب', en: 'Give me harder questions' },
        { ar: 'اشرح الإجابة الصحيحة', en: 'Explain the correct answer' },
        { ar: 'ما هي نقاط ضعفي؟', en: 'What are my weak points?' },
      ],
      studyplan: [
        { ar: 'أنشئ خطة أسبوعية', en: 'Create a weekly plan' },
        { ar: 'عدّل الخطة', en: 'Modify the plan' },
        { ar: 'أضف وقتاً للمراجعة', en: 'Add review time' },
        { ar: 'كيف أتابع تقدمي؟', en: 'How do I track my progress?' },
      ],
      projects: [
        { ar: 'اقترح مشروعاً عملياً', en: 'Suggest a practical project' },
        { ar: 'ما هي الخطوات التالية؟', en: 'What are the next steps?' },
        { ar: 'ما الأدوات المطلوبة؟', en: 'What tools are needed?' },
        { ar: 'كيف أقيّم نجاح المشروع؟', en: 'How do I evaluate project success?' },
      ],
      video: [
        { ar: 'لخّص محتوى الفيديو', en: 'Summarize video content' },
        { ar: 'ما هي النقاط المهمة؟', en: 'What are the important points?' },
        { ar: 'اربط بالمواد الدراسية', en: 'Link to study materials' },
        { ar: 'اختبرني على الفيديو', en: 'Test me on the video' },
      ],
      weblink: [
        { ar: 'حلل محتوى الرابط', en: 'Analyze link content' },
        { ar: 'ما هي المعلومات الجديدة؟', en: 'What is the new information?' },
        { ar: 'كيف يرتبط بدراستي؟', en: 'How does it relate to my studies?' },
        { ar: 'لخّص المقال', en: 'Summarize the article' },
      ],
    };

    const base = suggestions[personaId] || suggestions.teacher;
    const subjectSpecific = [
      { ar: `ما أهم موضوع يجب أن أتقنه في ${subjectName}؟`, en: `What is the most important topic to master in ${subjectName}?` },
      { ar: `أعطني تمريناً في ${subjectName}`, en: `Give me an exercise in ${subjectName}` },
    ];
    return [...subjectSpecific, ...base];
  };

  const suggestions = getSuggestions();

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
      <div className="w-full flex items-center gap-2 mb-2 text-sm text-muted-foreground">
        <Lightbulb className="w-4 h-4" />
        <span>{language === 'ar' ? 'اقتراحات ذكية' : 'Smart Suggestions'}</span>
      </div>
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="text-xs h-8"
          onClick={() => onSuggestionClick(language === 'ar' ? suggestion.ar : suggestion.en)}
        >
          {language === 'ar' ? suggestion.ar : suggestion.en}
        </Button>
      ))}
    </div>
  );
};

export default SmartSuggestions;
