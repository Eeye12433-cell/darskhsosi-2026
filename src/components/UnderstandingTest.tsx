import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ClipboardCheck, Loader2, Sparkles, BookOpen, CheckCircle, XCircle, Timer, Settings2, Trophy, RotateCcw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { getSubjectName } from '@/utils/subjectColors';
import { useUploadedMaterials } from '@/hooks/useUploadedMaterials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { useUserProgress } from '@/hooks/useUserProgress';
import ExportButtons from './chat/ExportButtons';

interface UnderstandingTestProps {
  language: 'ar' | 'en';
}

interface Question {
  question: string;
  options?: string[];
  correctAnswer?: number | string;
  explanation: string;
  type: 'mcq' | 'text';
}

interface TestSettings {
  questionType: 'mcq' | 'text' | 'mixed';
  timedTest: boolean;
  duration: number;
  includeIntelligenceQuestions: boolean;
}

const UnderstandingTest: React.FC<UnderstandingTestProps> = ({ language }) => {
  const { profile } = useProfile();
  const { materials, uploadFile, addMaterial, extractDocumentContent, loading: materialsLoading } = useUploadedMaterials();
  const { progress, saveProgress, loading: progressLoading } = useUserProgress('test');

  const [input, setInput] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [settings, setSettings] = useState<TestSettings>({
    questionType: 'mcq',
    timedTest: false,
    duration: 10,
    includeIntelligenceQuestions: false,
  });

  // Load progress
  useEffect(() => {
    if (progress && !isLoading) {
      if (progress.questions) setQuestions(progress.questions);
      if (progress.answers) setAnswers(progress.answers);
      if (progress.showResults !== undefined) setShowResults(progress.showResults);
      if (progress.settings) setSettings(progress.settings);
      if (progress.timeLeft !== undefined) setTimeLeft(progress.timeLeft);
    }
  }, [progress]);

  // Auto-save progress when it changes
  useEffect(() => {
    if (questions.length > 0 || Object.keys(answers).length > 0) {
      const timer = setTimeout(() => {
        saveProgress({
          questions,
          answers,
          showResults,
          settings,
          timeLeft
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [questions, answers, showResults, settings, timeLeft]);

  const materialsWithContent = materials.filter((m: any) => m.content);
  const materialsWithoutContent = materials.filter((m: any) => !m.content && m.storage_path);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { ar: 'اختبار الفهم المطور', en: 'Enhanced Understanding Test' },
      subtitle: { ar: 'اختبر فهمك للمادة بذكاء من خلال نصوصك أو ملفاتك', en: 'Test your understanding intelligently from text or files' },
      placeholder: { ar: 'الصق النص الذي تريد إنشاء اختبار له...', en: 'Paste the text you want to create a test for...' },
      generate: { ar: 'بدء الاختبار', en: 'Start Test' },
      selectMaterial: { ar: 'اختر من موادك المرفوعة', en: 'Select from your uploaded materials' },
      uploadDocument: { ar: 'رفع مستند جديد', en: 'Upload New Document' },
      uploadPrompt: { ar: 'اسحب وأفلت الملف هنا للبدء فوراً', en: 'Drag & drop file here to start immediately' },
      settings: { ar: 'إعدادات الاختبار', en: 'Test Settings' },
      qType: { ar: 'نوع الأسئلة', en: 'Question Type' },
      mcq: { ar: 'اختيار من متعدد', en: 'Multiple Choice' },
      text: { ar: 'أسئلة نصية', en: 'Text Questions' },
      mixed: { ar: 'مختلط', en: 'Mixed' },
      timed: { ar: 'اختبار موقوت', en: 'Timed Test' },
      duration: { ar: 'المدة (بالدقائق)', en: 'Duration (minutes)' },
      intel: { ar: 'إضافة أسئلة ذكاء وقدرات', en: 'Include Intelligence Questions' },
      submit: { ar: 'إنهاء الاختبار', en: 'Finish Test' },
      tryAgain: { ar: 'اختبار جديد', en: 'New Test' },
      score: { ar: 'النتيجة', en: 'Score' },
      timeLeft: { ar: 'الوقت المتبقي', en: 'Time Left' },
      extracting: { ar: 'جاري استخراج المحتوى...', en: 'Extracting content...' },
      correct: { ar: 'إجابة صحيحة', en: 'Correct' },
      wrong: { ar: 'إجابة خاطئة', en: 'Incorrect' },
      notAnswered: { ar: 'لم تتم الإجابة', en: 'Not Answered' },
      yourAnswer: { ar: 'إجابتك', en: 'Your Answer' },
      correctAnswer: { ar: 'الإجابة الصحيحة', en: 'Correct Answer' },
      explanation: { ar: 'الشرح', en: 'Explanation' },
      resultsTitle: { ar: 'نتائج الاختبار', en: 'Test Results' },
      excellent: { ar: 'ممتاز! أداء رائع 🌟', en: 'Excellent! Great job 🌟' },
      good: { ar: 'جيد جداً! استمر 💪', en: 'Very Good! Keep going 💪' },
      average: { ar: 'لا بأس، حاول مراجعة المادة 📖', en: 'Not bad, try reviewing the material 📖' },
      poor: { ar: 'تحتاج مزيد من المراجعة 📚', en: 'Needs more review 📚' },
      writeAnswer: { ar: 'اكتب إجابتك هنا...', en: 'Write your answer here...' },
      modelAnswer: { ar: 'الإجابة النموذجية', en: 'Model Answer' },
    };
    return translations[key]?.[language] || key;
  };

  useEffect(() => {
    let timer: any;
    if (timeLeft !== null && timeLeft > 0 && !showResults) {
      timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    } else if (timeLeft === 0 && !showResults) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [timeLeft, showResults]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(file);
      if (result) {
        const { data, error } = await addMaterial({
          file_name: result.originalFilename || file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: result.storagePath,
          content: result.content,
        });

        if (data?.id) {
          setSelectedMaterial(data.id);
          toast.success(language === 'ar' ? 'تم الرفع بنجاح، جاري معالجة الملف...' : 'Upload successful, processing file...');

          if (result.needsExtraction && result.storagePath) {
            const extractionResult = await extractDocumentContent(data.id, result.storagePath, result.fileType);
            if (extractionResult.success) {
              toast.success(language === 'ar' ? 'الملف جاهز الآن للاختبار' : 'File is now ready for testing');
            } else {
              toast.error(language === 'ar'
                ? `فشل استخراج محتوى الملف: ${extractionResult.error || ''}`
                : `Failed to extract file content: ${extractionResult.error || ''}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(language === 'ar' ? 'فشل رفع الملف' : 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    const material = materials.find((m: any) => m.id === selectedMaterial);
    const contentToTest = selectedMaterial ? material?.content : input;

    if (!contentToTest?.trim()) {
      if (selectedMaterial && !material?.content) {
        toast.info(t('extracting'));
        return;
      }
      toast.error(language === 'ar' ? 'يرجى إدخال نص أو اختيار ملف' : 'Please enter text or select a file');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setQuestions([]);
    setAnswers({});
    setShowResults(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
        setIsLoading(false);
        return;
      }

      const questionTypeInstruction = settings.questionType === 'mcq'
        ? (language === 'ar' 
          ? 'جميع الأسئلة يجب أن تكون اختيار من متعدد (mcq) مع 4 خيارات لكل سؤال. correctAnswer يجب أن يكون رقم الخيار الصحيح (0-3).'
          : 'All questions must be multiple choice (mcq) with 4 options each. correctAnswer must be the index of correct option (0-3).')
        : settings.questionType === 'text'
        ? (language === 'ar'
          ? 'جميع الأسئلة يجب أن تكون نصية (text). correctAnswer يجب أن يكون نص الإجابة النموذجية الكاملة.'
          : 'All questions must be text type. correctAnswer must be the full model answer text.')
        : (language === 'ar'
          ? 'اجعل نصف الأسئلة اختيار من متعدد (mcq) مع 4 خيارات والنصف الآخر أسئلة نصية (text). للـ mcq: correctAnswer = رقم الخيار (0-3). للـ text: correctAnswer = نص الإجابة النموذجية.'
          : 'Make half MCQ with 4 options and half text. For mcq: correctAnswer = option index (0-3). For text: correctAnswer = model answer text.');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intelligent-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `أنت مُقيّم تعليمي متخصص في مادة (${getSubjectName(profile?.subject || 'general', 'ar')}). مهمتك إنشاء اختبار دقيق ومتنوع ضمن هذه المادة فقط، بمصطلحاتها وأمثلتها.

القواعد الصارمة:
1. ${questionTypeInstruction}
2. أنشئ بالضبط 5 أسئلة متدرجة الصعوبة.
3. كل سؤال يجب أن يحتوي على نص واضح وكامل في حقل "question".
4. كل سؤال يجب أن يحتوي على "explanation" مفصل يشرح الإجابة الصحيحة.
5. ${settings.includeIntelligenceQuestions ? 'أضف سؤالين إضافيين للذكاء والمنطق مرتبطين بالموضوع.' : ''}

الصيغة المطلوبة (JSON Array فقط، بدون أي نص إضافي):
[
  {
    "question": "نص السؤال الكامل هنا",
    "type": "mcq",
    "options": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
    "correctAnswer": 0,
    "explanation": "شرح مفصل للإجابة الصحيحة"
  },
  {
    "question": "نص السؤال النصي هنا",
    "type": "text",
    "correctAnswer": "الإجابة النموذجية الكاملة هنا",
    "explanation": "شرح مفصل للإجابة"
  }
]

مهم جداً: 
- لا تكتب أي شيء قبل أو بعد الـ JSON Array.
- حقل "question" يجب أن يحتوي على نص السؤال الفعلي وليس فارغاً أبداً.
- حقل "correctAnswer" إلزامي لكل سؤال.
- اللغة: ${language === 'ar' ? 'العربية' : 'English'}`
            },
            {
              role: 'user',
              content: `أنشئ اختباراً بناءً على المحتوى التالي:\n\n${contentToTest.substring(0, 15000)}`,
            },
          ],
          learnerProfile: profile,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              fullContent += content;
            } catch (e) {
              // Skip invalid JSON chunks
            }
          }
        }
      }

      console.log('Full AI response:', fullContent);

      // Extract individual question objects using regex for robustness
      const parseQuestionsFromResponse = (text: string): Question[] => {
        const questions: Question[] = [];
        
        // First try: standard JSON array parse
        try {
          let bracketCount = 0;
          let startIdx = -1;
          for (let i = 0; i < text.length; i++) {
            if (text[i] === '[') { if (startIdx === -1) startIdx = i; bracketCount++; }
            else if (text[i] === ']') { bracketCount--; if (bracketCount === 0 && startIdx !== -1) {
              const parsed = JSON.parse(text.substring(startIdx, i + 1));
              if (Array.isArray(parsed) && parsed.length > 0) {
                const valid = parsed.filter((q: any) => q.question && typeof q.question === 'string' && q.question.length > 10);
                if (valid.length > 0) return valid.map((q: any) => ({
                  question: q.question,
                  type: (q.type === 'text' ? 'text' : 'mcq') as 'mcq' | 'text',
                  options: q.type === 'mcq' || (q.options && q.options.length > 0) ? (q.options || []) : undefined,
                  correctAnswer: q.correctAnswer ?? (q.type === 'mcq' ? 0 : ''),
                  explanation: q.explanation || '',
                }));
              }
              break;
            }}
          }
        } catch (e) {
          console.warn('Standard JSON parse failed, trying individual extraction:', e);
        }

        // Fallback: extract individual {...} objects
        const objectPattern = /\{[^{}]*"question"\s*:\s*"[^"]{10,}"[^{}]*\}/g;
        let match;
        while ((match = objectPattern.exec(text)) !== null) {
          try {
            const obj = JSON.parse(match[0]);
            if (obj.question && obj.question.length > 10) {
              questions.push({
                question: obj.question,
                type: (obj.type === 'text' ? 'text' : 'mcq') as 'mcq' | 'text',
                options: obj.type === 'mcq' || (obj.options && obj.options.length > 0) ? (obj.options || []) : undefined,
                correctAnswer: obj.correctAnswer ?? (obj.type === 'mcq' ? 0 : ''),
                explanation: obj.explanation || '',
              });
            }
          } catch (e) { /* skip malformed objects */ }
        }
        
        return questions;
      };

      const parsedQuestions = parseQuestionsFromResponse(fullContent);
      
      if (parsedQuestions.length > 0) {
        // Filter out any questions with obviously truncated text (ending mid-word without punctuation)
        const validQuestions = parsedQuestions.filter(q => 
          q.question.length > 10 && 
          (q.type !== 'mcq' || (q.options && q.options.length >= 2))
        );
        
        if (validQuestions.length > 0) {
          setQuestions(validQuestions);
          if (settings.timedTest) setTimeLeft(settings.duration * 60);
          toast.success(language === 'ar' ? `تم إنشاء ${validQuestions.length} أسئلة بنجاح!` : `${validQuestions.length} questions generated successfully!`);
        } else {
          toast.error(language === 'ar' ? 'الأسئلة المولدة غير مكتملة. حاول مرة أخرى.' : 'Generated questions were incomplete. Try again.');
        }
      } else {
        console.error('No valid questions found in response:', fullContent);
        toast.error(language === 'ar' ? 'لم يتم العثور على أسئلة صالحة. حاول مرة أخرى.' : 'No valid questions found. Try again.');
      }
    } catch (error) {
      console.error('Error generating test:', error);
      toast.error(language === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
    setTimeLeft(null);
  };

  const handleNewTest = () => {
    setQuestions([]);
    setAnswers({});
    setShowResults(false);
    setTimeLeft(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate score
  const getScore = () => {
    let correct = 0;
    let total = questions.length;
    
    questions.forEach((q, idx) => {
      if (q.type === 'mcq') {
        if (answers[idx] !== undefined && answers[idx] === q.correctAnswer) {
          correct++;
        }
      }
      // Text questions are not auto-graded but shown with model answer
    });

    const mcqQuestions = questions.filter(q => q.type === 'mcq');
    const textQuestions = questions.filter(q => q.type === 'text');
    
    return {
      correct,
      mcqTotal: mcqQuestions.length,
      textTotal: textQuestions.length,
      total,
      percentage: mcqQuestions.length > 0 ? Math.round((correct / mcqQuestions.length) * 100) : 0,
    };
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return t('excellent');
    if (percentage >= 70) return t('good');
    if (percentage >= 50) return t('average');
    return t('poor');
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const isQuestionCorrect = (q: Question, idx: number): boolean | null => {
    if (q.type === 'text') return null; // Can't auto-grade text
    if (answers[idx] === undefined) return null;
    return answers[idx] === q.correctAnswer;
  };

  return (
    <div className="h-full flex flex-col p-3 sm:p-4 md:p-6 overflow-auto gsap-theme-animate" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex-1 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        {questions.length > 0 && (
          <div className="shrink-0 absolute top-4 end-4">
            <ExportButtons
              language={language}
              messages={questions.map((q, i) => ([
                { role: 'assistant' as const, content: `${language === 'ar' ? 'سؤال' : 'Question'} ${i + 1}: ${q.question}` },
                answers[i] !== undefined ? { role: 'user' as const, content: `${language === 'ar' ? 'إجابة' : 'Answer'} ${i + 1}: ${q.type === 'mcq' ? (q.options ? q.options[answers[i]] : answers[i]) : answers[i]}` } : null
              ].filter(Boolean) as any)).flat()}
              title={t('title')}
            />
          </div>
        )}
      </div>


      {questions.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto w-full">
          <div className="space-y-6">
            <Card className="p-6 space-y-4 shadow-lg border-primary/10" data-helper-target="test-settings">
              <h3 className="font-semibold flex items-center gap-2 text-primary">
                <BookOpen className="w-5 h-5" /> {t('selectMaterial')}
              </h3>

              <div className="grid gap-4">
                {materials.length > 0 && (
                  <Select value={selectedMaterial} onValueChange={(v) => { setSelectedMaterial(v); setInput(''); }}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('selectMaterial')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-muted-foreground italic">{t('placeholder')}</SelectItem>
                      {[...materialsWithContent, ...materialsWithoutContent].map((m: any) => (
                        <SelectItem key={m.id} value={m.id} disabled={!m.content && m.storage_path}>
                          <div className="flex items-center gap-2">
                            {m.file_name}
                            {!m.content && m.storage_path && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded animate-pulse">
                                {t('extracting')}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/20 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-8 h-8 text-primary mb-2 opacity-50" />
                          <p className="text-sm font-medium">{t('uploadDocument')}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t('uploadPrompt')}</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} accept=".pdf,.docx,.doc,.txt,.md" />
                  </label>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{language === 'ar' ? 'أو' : 'OR'}</span></div>
              </div>

              <Textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); setSelectedMaterial(''); }}
                placeholder={t('placeholder')}
                className="min-h-[180px] resize-none bg-muted/30 focus:bg-background transition-colors"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 space-y-6 shadow-lg border-primary/10">
              <h3 className="font-semibold flex items-center gap-2 text-primary"><Settings2 className="w-5 h-5" /> {t('settings')}</h3>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">{t('qType')}</Label>
                  <Select value={settings.questionType} onValueChange={(v: any) => setSettings({ ...settings, questionType: v })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">{t('mcq')}</SelectItem>
                      <SelectItem value="text">{t('text')}</SelectItem>
                      <SelectItem value="mixed">{t('mixed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <Label htmlFor="timed-switch" className="flex-1 cursor-pointer">{t('timed')}</Label>
                  <Switch id="timed-switch" checked={settings.timedTest} onCheckedChange={(v) => setSettings({ ...settings, timedTest: v })} />
                </div>

                {settings.timedTest && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-sm">{t('duration')}</Label>
                    <div className="flex items-center gap-3">
                      <Input type="number" min="1" max="120" value={settings.duration} onChange={(e) => setSettings({ ...settings, duration: parseInt(e.target.value) })} className="h-11" />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <Label htmlFor="intel-switch" className="flex-1 cursor-pointer">{t('intel')}</Label>
                  <Switch id="intel-switch" checked={settings.includeIntelligenceQuestions} onCheckedChange={(v) => setSettings({ ...settings, includeIntelligenceQuestions: v })} />
                </div>
              </div>

              <Button
                data-helper-target="start-test"
                onClick={handleGenerate}
                disabled={(!input.trim() && !selectedMaterial) || isLoading || isUploading}
                className="w-full h-12 text-lg font-bold shadow-lg hover:shadow-xl transition-all gradient-primary"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Sparkles className="w-5 h-5 me-2" />}
                {t('generate')}
              </Button>
            </Card>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {/* Timer */}
          {timeLeft !== null && (
            <Card className="p-4 sticky top-0 z-10 bg-background/80 backdrop-blur flex items-center justify-center border-primary">
              <div className="flex items-center gap-2 text-primary font-bold text-lg">
                <Timer className="w-5 h-5" />
                {t('timeLeft')}: {formatTime(timeLeft)}
              </div>
            </Card>
          )}

          {/* Score Summary */}
          {showResults && (() => {
            const score = getScore();
            return (
              <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="text-center space-y-3">
                  <Trophy className="w-12 h-12 mx-auto text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">{t('resultsTitle')}</h2>
                  
                  {score.mcqTotal > 0 && (
                    <div className={cn("text-4xl font-black", getScoreColor(score.percentage))}>
                      {score.percentage}%
                    </div>
                  )}
                  
                  <p className="text-lg font-medium text-foreground">
                    {score.mcqTotal > 0 && getScoreMessage(score.percentage)}
                  </p>
                  
                  <div className="flex justify-center gap-6 text-sm text-muted-foreground pt-2">
                    {score.mcqTotal > 0 && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{score.correct}/{score.mcqTotal} {language === 'ar' ? 'صحيحة' : 'correct'}</span>
                      </div>
                    )}
                    {score.textTotal > 0 && (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-blue-500" />
                        <span>{score.textTotal} {language === 'ar' ? 'أسئلة نصية (راجع إجابتك)' : 'text questions (review your answer)'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Questions */}
          {questions.map((q, idx) => {
            const isCorrect = isQuestionCorrect(q, idx);
            const answered = answers[idx] !== undefined && answers[idx] !== '';
            
            return (
              <Card 
                key={idx} 
                className={cn(
                  "p-6 space-y-4 transition-all",
                  showResults && q.type === 'mcq' && isCorrect === true && "border-green-400 bg-green-50/50 dark:bg-green-950/20",
                  showResults && q.type === 'mcq' && isCorrect === false && "border-red-400 bg-red-50/50 dark:bg-red-950/20",
                  showResults && q.type === 'mcq' && !answered && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
                  showResults && q.type === 'text' && "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20",
                )}
              >
                {/* Question Header */}
                <div className="flex items-start gap-3">
                  <span className={cn(
                    "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    showResults && isCorrect === true && "bg-green-500 text-white",
                    showResults && isCorrect === false && "bg-red-500 text-white",
                    showResults && q.type === 'text' && "bg-blue-500 text-white",
                    !showResults && "bg-primary/10 text-primary",
                    showResults && !answered && q.type === 'mcq' && "bg-amber-500 text-white",
                  )}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground leading-relaxed">{q.question}</h3>
                    {showResults && q.type === 'mcq' && (
                      <div className="mt-1">
                        {isCorrect === true && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                            <CheckCircle className="w-4 h-4" /> {t('correct')}
                          </span>
                        )}
                        {isCorrect === false && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
                            <XCircle className="w-4 h-4" /> {t('wrong')}
                          </span>
                        )}
                        {!answered && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
                            <AlertCircle className="w-4 h-4" /> {t('notAnswered')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* MCQ Options */}
                {q.type === 'mcq' && q.options && q.options.length > 0 ? (
                  <RadioGroup
                    value={answers[idx] !== undefined ? answers[idx].toString() : ''}
                    onValueChange={(v) => setAnswers(prev => ({ ...prev, [idx]: parseInt(v) }))}
                    disabled={showResults}
                    className="space-y-2"
                  >
                    {q.options.map((opt, oIdx) => {
                      const isThisCorrect = oIdx === q.correctAnswer;
                      const isThisSelected = answers[idx] === oIdx;
                      
                      return (
                        <div 
                          key={`q${idx}-opt${oIdx}`} 
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                            !showResults && "hover:bg-accent border-transparent hover:border-primary/20",
                            !showResults && isThisSelected && "border-primary bg-primary/5",
                            showResults && isThisCorrect && "bg-green-100 border-green-500 dark:bg-green-950/30",
                            showResults && isThisSelected && !isThisCorrect && "bg-red-100 border-red-500 dark:bg-red-950/30",
                            showResults && !isThisCorrect && !isThisSelected && "opacity-60 border-transparent",
                          )}
                        >
                          <RadioGroupItem value={oIdx.toString()} id={`q${idx}-o${oIdx}`} />
                          <Label htmlFor={`q${idx}-o${oIdx}`} className="flex-1 cursor-pointer text-base">
                            {opt}
                          </Label>
                          {showResults && isThisCorrect && <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />}
                          {showResults && isThisSelected && !isThisCorrect && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </RadioGroup>
                ) : (
                  /* Text Answer */
                  <div className="space-y-3">
                    <Textarea
                      value={answers[idx] || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                      disabled={showResults}
                      placeholder={t('writeAnswer')}
                      className="min-h-[100px] text-base"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                    {showResults && q.correctAnswer && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          {t('modelAnswer')}
                        </p>
                        <p className="text-blue-800 dark:text-blue-200 leading-relaxed">{String(q.correctAnswer)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {showResults && q.explanation && (
                  <div className="mt-3 p-4 bg-muted/80 rounded-lg border border-border">
                    <p className="font-bold text-sm text-primary mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      {t('explanation')}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </Card>
            );
          })}

          {/* Action Buttons */}
          <div className="flex gap-3 pb-4">
            {showResults ? (
              <>
                <Button onClick={handleNewTest} className="flex-1 h-12 gradient-primary text-lg font-bold">
                  <RotateCcw className="w-5 h-5 me-2" />
                  {t('tryAgain')}
                </Button>
              </>
            ) : (
              <Button onClick={handleSubmit} className="flex-1 h-12 gradient-primary text-lg font-bold">
                <ClipboardCheck className="w-5 h-5 me-2" />
                {t('submit')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnderstandingTest;
