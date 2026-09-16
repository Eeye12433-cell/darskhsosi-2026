import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getSubjectTheme } from '@/utils/subjectColors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Star, Trash2, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BankQuestion {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  difficulty: string;
  is_favorite: boolean;
  times_correct: number;
  times_wrong: number;
  created_at: string;
}

interface Props {
  language: 'ar' | 'en';
}

const QuestionBank: React.FC<Props> = ({ language }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const subject = profile?.subject || 'general';
  const theme = getSubjectTheme(subject);
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState('5');
  const [difficulty, setDifficulty] = useState('medium');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const fetchQuestions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('question_bank')
      .select('*')
      .eq('user_id', user.id)
      .eq('subject', subject)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('question_bank fetch error', error);
    } else {
      setQuestions((data || []).map((q: any) => ({ ...q, options: Array.isArray(q.options) ? q.options : [] })));
    }
    setLoading(false);
  }, [user, subject]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const visible = useMemo(
    () => (filter === 'favorites' ? questions.filter(q => q.is_favorite) : questions),
    [questions, filter]
  );

  const stats = useMemo(() => {
    const correct = questions.reduce((s, q) => s + q.times_correct, 0);
    const wrong = questions.reduce((s, q) => s + q.times_wrong, 0);
    const total = correct + wrong;
    return { correct, wrong, accuracy: total ? Math.round((correct / total) * 100) : 0 };
  }, [questions]);

  const handleGenerate = async () => {
    if (!user) return;
    if (!topic.trim()) {
      toast({ title: t('اكتب موضوع الأسئلة أولاً', 'Enter a topic first'), variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: {
          topic: topic.trim(),
          subject,
          subjectName: language === 'ar' ? theme.nameAr : theme.nameEn,
          language,
          count: Number(count),
          difficulty,
          educationLevel: profile?.education_level || '',
        },
      });
      if (error) throw error;
      const generated = data?.questions || [];
      if (!generated.length) throw new Error('empty');

      const rows = generated.map((q: any) => ({
        user_id: user.id,
        subject,
        topic: q.topic || topic.trim(),
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
        difficulty: q.difficulty || difficulty,
      }));
      const { error: insertError } = await supabase.from('question_bank').insert(rows);
      if (insertError) throw insertError;

      toast({ title: t(`تمت إضافة ${rows.length} سؤال إلى البنك`, `${rows.length} questions added`) });
      setTopic('');
      await fetchQuestions();
    } catch (e) {
      console.error(e);
      toast({
        title: t('تعذّر توليد الأسئلة، حاول مرة أخرى', 'Could not generate questions, try again'),
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = async (q: BankQuestion, index: number) => {
    if (answers[q.id] !== undefined) return;
    setAnswers(prev => ({ ...prev, [q.id]: index }));
    const isCorrect = index === q.correct_index;
    const updates = isCorrect
      ? { times_correct: q.times_correct + 1 }
      : { times_wrong: q.times_wrong + 1 };
    setQuestions(prev => prev.map(item => (item.id === q.id ? { ...item, ...updates } : item)));
    await supabase.from('question_bank').update(updates).eq('id', q.id);
  };

  const toggleFavorite = async (q: BankQuestion) => {
    const next = !q.is_favorite;
    setQuestions(prev => prev.map(item => (item.id === q.id ? { ...item, is_favorite: next } : item)));
    await supabase.from('question_bank').update({ is_favorite: next }).eq('id', q.id);
  };

  const removeQuestion = async (q: BankQuestion) => {
    setQuestions(prev => prev.filter(item => item.id !== q.id));
    await supabase.from('question_bank').delete().eq('id', q.id);
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: theme.gradient }}>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            {t('بنك الأسئلة والمعرفة', 'Question & Knowledge Bank')}
          </h1>
          <p className="text-sm opacity-90 mt-1">
            {t(
              `أسئلة مخصّصة لمادة ${theme.nameAr} تُحفظ لك للمراجعة في أي وقت`,
              `Questions tailored to ${theme.nameEn}, saved for later review`
            )}
          </p>
          <div className="flex gap-4 mt-4 text-sm font-semibold">
            <span>{t('الأسئلة', 'Questions')}: {questions.length}</span>
            <span>{t('إجابات صحيحة', 'Correct')}: {stats.correct}</span>
            <span>{t('الدقة', 'Accuracy')}: {stats.accuracy}%</span>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t('توليد أسئلة جديدة بالذكاء الاصطناعي', 'Generate new questions with AI')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={t('اكتب الموضوع أو الدرس، مثل: قوانين نيوتن', 'Enter a topic, e.g. Newton\'s laws')}
              maxLength={200}
            />
            <div className="flex flex-wrap gap-3">
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['3', '5', '10', '15'].map(n => (
                    <SelectItem key={n} value={n}>{n} {t('أسئلة', 'questions')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{t('سهل', 'Easy')}</SelectItem>
                  <SelectItem value="medium">{t('متوسط', 'Medium')}</SelectItem>
                  <SelectItem value="hard">{t('صعب', 'Hard')}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleGenerate} disabled={generating} className="flex-1 min-w-40">
                {generating ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Sparkles className="w-4 h-4 me-2" />}
                {t('توليد وحفظ', 'Generate & save')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
            {t('كل الأسئلة', 'All')}
          </Button>
          <Button variant={filter === 'favorites' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('favorites')}>
            <Star className="w-4 h-4 me-1" />{t('المفضلة', 'Favorites')}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : visible.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            {t('لا توجد أسئلة بعد في هذه المادة. ابدأ بتوليد أسئلة جديدة.', 'No questions yet for this subject. Generate some to start.')}
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {visible.map(q => {
              const chosen = answers[q.id];
              return (
                <Card key={q.id}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold leading-relaxed">{q.question}</p>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" aria-label="Favorite" onClick={() => toggleFavorite(q)}>
                          <Star className={cn('w-4 h-4', q.is_favorite && 'fill-amber-400 text-amber-400')} />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => removeQuestion(q)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{q.topic}</Badge>
                      <Badge variant="outline">{q.difficulty}</Badge>
                      <Badge variant="outline">✅ {q.times_correct} · ❌ {q.times_wrong}</Badge>
                    </div>
                    <div className="grid gap-2">
                      {q.options.map((opt, i) => {
                        const answered = chosen !== undefined;
                        const isCorrect = i === q.correct_index;
                        return (
                          <button
                            key={i}
                            onClick={() => handleAnswer(q, i)}
                            disabled={answered}
                            className={cn(
                              'text-start rounded-lg border p-3 text-sm transition-colors',
                              !answered && 'hover:bg-muted',
                              answered && isCorrect && 'border-green-500 bg-green-500/10',
                              answered && !isCorrect && chosen === i && 'border-destructive bg-destructive/10'
                            )}
                          >
                            <span className="flex items-center gap-2">
                              {answered && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                              {answered && !isCorrect && chosen === i && <XCircle className="w-4 h-4 text-destructive" />}
                              {opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {chosen !== undefined && q.explanation && (
                      <p className="text-sm bg-muted rounded-lg p-3 leading-relaxed">{q.explanation}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBank;
