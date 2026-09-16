import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useUploadedMaterials } from '@/hooks/useUploadedMaterials';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { getSubjectName, getSubjectTheme } from '@/utils/subjectColors';
import {
  Loader2, TrendingUp, Star, Target, Lightbulb, BookOpen, MessageSquare, Layers, Calendar, Send, Bot,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

interface LearningProgressProps {
  language: 'ar' | 'en';
}

interface SubjectStat {
  subject: string;
  label: string;
  color: string;
  messages: number;
  conversations: number;
  flashcards: number;
  plans: number;
  lastActive: string | null;
  score: number;
}

const LearningProgress: React.FC<LearningProgressProps> = ({ language }) => {
  const { materials, loading: materialsLoading } = useUploadedMaterials();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalFlashcardSets: 0,
    totalStudyPlans: 0,
    messagesToday: 0,
    streak: 0,
    weeklyActivity: [] as { day: string; count: number }[],
    timeline: [] as { date: string; count: number }[],
    subjects: [] as SubjectStat[],
  });

  // AI coach state
  const [coachMessages, setCoachMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [coachInput, setCoachInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const coachEndRef = useRef<HTMLDivElement>(null);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const since = new Date();
        since.setDate(since.getDate() - 29);
        since.setHours(0, 0, 0, 0);

        const [convRes, msgRes, flashRes, planRes] = await Promise.all([
          supabase.from('conversations').select('id, subject, created_at, updated_at').eq('user_id', user.id),
          supabase.from('chat_messages').select('id, conversation_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3000),
          supabase.from('flashcard_sets').select('id, created_at').eq('user_id', user.id),
          supabase.from('study_plans').select('id, subject, created_at').eq('user_id', user.id),
        ]);

        const conversations = convRes.data || [];
        const messages = msgRes.data || [];
        const flashcards = flashRes.data || [];
        const plans = planRes.data || [];

        const convSubject = new Map<string, string>();
        conversations.forEach((c: any) => convSubject.set(c.id, c.subject || 'general'));

        // Aggregate per subject
        const bucket = new Map<string, SubjectStat>();
        const ensure = (subject: string): SubjectStat => {
          const key = subject || 'general';
          if (!bucket.has(key)) {
            bucket.set(key, {
              subject: key,
              label: getSubjectName(key, language),
              color: getSubjectTheme(key).primary,
              messages: 0, conversations: 0, flashcards: 0, plans: 0,
              lastActive: null, score: 0,
            });
          }
          return bucket.get(key)!;
        };

        conversations.forEach((c: any) => {
          const s = ensure(c.subject || 'general');
          s.conversations += 1;
          if (!s.lastActive || c.updated_at > s.lastActive) s.lastActive = c.updated_at;
        });

        messages.forEach((m: any) => {
          const subject = m.conversation_id ? convSubject.get(m.conversation_id) || 'general' : 'general';
          const s = ensure(subject);
          s.messages += 1;
          if (!s.lastActive || m.created_at > s.lastActive) s.lastActive = m.created_at;
        });

        plans.forEach((p: any) => { ensure(p.subject || 'general').plans += 1; });
        // Flashcards are not subject-tagged yet: attribute to general bucket
        if (flashcards.length) ensure('general').flashcards += flashcards.length;

        const subjects = Array.from(bucket.values()).map((s) => {
          // Evaluation score (0-100): activity depth + variety + recency
          const activity = Math.min(60, s.messages * 2);
          const variety = Math.min(25, s.conversations * 3 + s.plans * 6 + s.flashcards * 4);
          const days = s.lastActive ? (Date.now() - new Date(s.lastActive).getTime()) / 86400000 : 999;
          const recency = days <= 1 ? 15 : days <= 3 ? 12 : days <= 7 ? 8 : days <= 14 ? 4 : 0;
          return { ...s, score: Math.round(Math.min(100, activity + variety + recency)) };
        }).sort((a, b) => b.messages - a.messages);

        // Timeline (last 14 days) and weekly bars
        const dayNames = language === 'ar'
          ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
          : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const countsByDay = new Map<string, number>();
        messages.forEach((m: any) => {
          const key = new Date(m.created_at).toISOString().slice(0, 10);
          countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
        });

        const timeline: { date: string; count: number }[] = [];
        const weeklyActivity: { day: string; count: number }[] = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          const count = countsByDay.get(key) || 0;
          timeline.push({ date: key.slice(5), count });
          if (i < 7) weeklyActivity.push({ day: dayNames[d.getDay()], count });
        }

        // Streak
        let streak = 0;
        for (let i = 0; i < 60; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          if ((countsByDay.get(key) || 0) > 0) streak++;
          else if (i > 0) break;
        }

        const todayKey = new Date().toISOString().slice(0, 10);

        setStats({
          totalMessages: messages.length,
          totalFlashcardSets: flashcards.length,
          totalStudyPlans: plans.length,
          messagesToday: countsByDay.get(todayKey) || 0,
          streak,
          weeklyActivity,
          timeline,
          subjects,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, language]);

  useEffect(() => {
    coachEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [coachMessages, coachLoading]);

  const totalMaterials = materials.length;

  const analyticsSummary = useMemo(() => {
    const lines = stats.subjects.map((s) =>
      `- ${s.label}: ${s.messages} ${t('رسالة', 'messages')}, ${s.conversations} ${t('محادثة', 'conversations')}, ${s.plans} ${t('خطة', 'plans')}, ${t('درجة التقييم', 'score')} ${s.score}/100, ${t('آخر نشاط', 'last active')}: ${s.lastActive ? new Date(s.lastActive).toISOString().slice(0, 10) : t('لا يوجد', 'none')}`
    ).join('\n');
    return [
      `${t('إجمالي الرسائل', 'Total messages')}: ${stats.totalMessages}`,
      `${t('سلسلة الأيام', 'Day streak')}: ${stats.streak}`,
      `${t('نشاط اليوم', 'Today')}: ${stats.messagesToday}`,
      `${t('المواد المرفوعة', 'Uploaded materials')}: ${totalMaterials}`,
      `${t('مجموعات البطاقات', 'Flashcard sets')}: ${stats.totalFlashcardSets}`,
      `${t('الخطط الدراسية', 'Study plans')}: ${stats.totalStudyPlans}`,
      `${t('تفصيل المواد', 'Per subject')}:\n${lines || t('لا توجد بيانات', 'no data')}`,
      `${t('النشاط اليومي (14 يوماً)', 'Daily activity (14 days)')}: ${stats.timeline.map((d) => `${d.date}=${d.count}`).join(', ')}`,
    ].join('\n');
  }, [stats, totalMaterials, language]);

  const askCoach = async (question: string) => {
    if (!question.trim() || coachLoading) return;
    const nextMessages = [...coachMessages, { role: 'user' as const, content: question }];
    setCoachMessages(nextMessages);
    setCoachInput('');
    setCoachLoading(true);

    const systemPrompt = language === 'ar'
      ? `أنت مستشار تحليلات تعليمي. لديك ملخص إحصائي فعلي لأداء المتعلم. حلّل الأرقام بدقة، وقيّم كل مادة (ممتاز 80+، جيد 60-79، يحتاج تحسين 40-59، ضعيف أقل من 40) استناداً إلى درجة التقييم والنشاط والانتظام، ثم قدّم توصيات عملية قصيرة. لا تخترع أرقاماً غير موجودة.\n\nالبيانات:\n${analyticsSummary}`
      : `You are a learning analytics coach. You have the learner's real statistics. Analyse them precisely, grade each subject (Excellent 80+, Good 60-79, Needs work 40-59, Weak below 40) based on score, activity and consistency, then give short actionable recommendations. Never invent numbers.\n\nData:\n${analyticsSummary}`;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/intelligent-teacher`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...nextMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let buffer = '';
      setCoachMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';
        for (const line of parts) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setCoachMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: assistantText };
                return copy;
              });
            }
          } catch {
            /* ignore partial chunks */
          }
        }
      }

      if (!assistantText) {
        setCoachMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: 'assistant',
            content: t('تعذّر الحصول على تحليل الآن. حاول مرة أخرى.', 'Could not get an analysis right now. Please try again.'),
          };
          return copy;
        });
      }
    } catch (err) {
      console.error('Coach error:', err);
      setCoachMessages((prev) => [...prev, {
        role: 'assistant',
        content: t('حدث خطأ أثناء التحليل. حاول مرة أخرى بعد قليل.', 'Something went wrong. Please try again shortly.'),
      }]);
    } finally {
      setCoachLoading(false);
    }
  };

  if (loading || materialsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pieData = stats.subjects
    .filter((s) => s.messages > 0)
    .map((s) => ({ name: s.label, value: s.messages, color: s.color }));

  const statCards = [
    { icon: MessageSquare, label: t('الرسائل', 'Messages'), value: stats.totalMessages },
    { icon: Star, label: t('سلسلة الأيام', 'Day Streak'), value: `${stats.streak} ${t('يوم', 'days')}` },
    { icon: BookOpen, label: t('المواد', 'Materials'), value: totalMaterials },
    { icon: Layers, label: t('البطاقات', 'Flashcards'), value: stats.totalFlashcardSets },
    { icon: Calendar, label: t('خطط دراسية', 'Study Plans'), value: stats.totalStudyPlans },
    { icon: Target, label: t('اليوم', 'Today'), value: stats.messagesToday },
  ];

  const gradeLabel = (score: number) =>
    score >= 80 ? t('ممتاز', 'Excellent')
      : score >= 60 ? t('جيد', 'Good')
        : score >= 40 ? t('يحتاج تحسين', 'Needs work')
          : t('ضعيف', 'Weak');

  const quickQuestions = [
    t('ما أقوى وأضعف مادة لدي؟', 'Which subject am I strongest and weakest in?'),
    t('كيف أحسّن انتظامي الأسبوعي؟', 'How can I improve my weekly consistency?'),
    t('اقترح خطة مراجعة للأسبوع القادم', 'Suggest a review plan for next week'),
  ];

  return (
    <div className="flex flex-col h-full p-3 sm:p-4 md:p-6 overflow-y-auto custom-scrollbar gsap-theme-animate" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          {t('لوحة التحليلات', 'Analytics Dashboard')}
        </h2>
        <p className="text-muted-foreground mt-2">{t('تفاصيل تقدمك مقسّمة حسب كل مادة', 'Your progress broken down by subject')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</span>
            </Card>
          );
        })}
      </div>

      {/* Per-subject evaluation */}
      <Card className="p-4 sm:p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">{t('تقييم كل مادة', 'Subject Evaluation')}</h3>
        {stats.subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('لا توجد بيانات كافية بعد. ابدأ محادثة تعلم لتظهر التحليلات.', 'Not enough data yet. Start a learning chat to see analytics.')}</p>
        ) : (
          <div className="space-y-4">
            {stats.subjects.map((s) => (
              <div key={s.subject} className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-medium text-foreground">{s.label}</span>
                    <Badge variant="secondary">{gradeLabel(s.score)}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {s.messages} {t('رسالة', 'msgs')} · {s.conversations} {t('محادثة', 'chats')} · {s.plans} {t('خطة', 'plans')} · {s.score}/100
                  </span>
                </div>
                <Progress value={s.score} className="h-2" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className="p-4 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4">{t('مقارنة المواد', 'Subject Comparison')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.subjects.map((s) => ({ name: s.label, [t('رسائل', 'Messages')]: s.messages, [t('التقييم', 'Score')]: s.score }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey={t('رسائل', 'Messages')} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey={t('التقييم', 'Score')} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4">{t('الخط الزمني (14 يوماً)', 'Timeline (14 days)')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4">{t('النشاط الأسبوعي', 'Weekly Activity')}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyActivity}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {pieData.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold text-foreground mb-4">{t('توزيع النشاط حسب المادة', 'Activity by Subject')}</h3>
            <div className="h-48 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* AI analytics coach */}
      <Card className="p-4 sm:p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          {t('المساعد التحليلي', 'Analytics Assistant')}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('اسأل عن أرقامك ومستواك في كل مادة، وسيقيّم أداءك بناءً على بياناتك الفعلية.', 'Ask about your numbers and subject levels — it evaluates you from your real data.')}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {quickQuestions.map((q) => (
            <Button key={q} variant="outline" size="sm" disabled={coachLoading} onClick={() => askCoach(q)}>
              {q}
            </Button>
          ))}
        </div>

        <div className="max-h-72 overflow-y-auto space-y-3 mb-3 custom-scrollbar">
          {coachMessages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-end' : 'text-start'}>
              <div className={`inline-block max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                {m.content || '…'}
              </div>
            </div>
          ))}
          {coachLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('يحلّل بياناتك...', 'Analysing your data...')}
            </div>
          )}
          <div ref={coachEndRef} />
        </div>

        <form
          className="flex items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); askCoach(coachInput); }}
        >
          <Input
            value={coachInput}
            onChange={(e) => setCoachInput(e.target.value)}
            placeholder={t('اكتب سؤالك عن التحليلات...', 'Ask about your analytics...')}
            disabled={coachLoading}
          />
          <Button type="submit" size="icon" disabled={coachLoading || !coachInput.trim()} aria-label={t('إرسال', 'Send')}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>

      <Card className="p-4 bg-secondary/50 mt-auto">
        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-accent" />
          {t('نصيحة اليوم', 'Tip of the Day')}
        </h4>
        <p className="text-sm text-muted-foreground">
          {t(
            'حاول مراجعة ما تعلمته خلال الـ 24 ساعة الماضية. المراجعة المتكررة تساعد على تثبيت المعلومات في الذاكرة طويلة المدى.',
            'Try reviewing what you learned in the last 24 hours. Repeated review helps consolidate information in long-term memory.'
          )}
        </p>
      </Card>
    </div>
  );
};

export default LearningProgress;
