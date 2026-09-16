import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUploadedMaterials } from '@/hooks/useUploadedMaterials';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getSubjectName } from '@/utils/subjectColors';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, RotateCcw, ChevronLeft, ChevronRight, Sparkles, Trash2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Flashcard {
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface FlashcardSet {
  id: string;
  title: string;
  cards: Flashcard[];
  created_at: string;
}

interface FlashcardFeatureProps {
  language: 'ar' | 'en';
}

const FlashcardFeature: React.FC<FlashcardFeatureProps> = ({ language }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { materials } = useUploadedMaterials();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [activeSet, setActiveSet] = useState<FlashcardSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [customContent, setCustomContent] = useState('');
  const [cardCount, setCardCount] = useState('10');
  const [loadingSets, setLoadingSets] = useState(true);

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  // Load saved flashcard sets
  useEffect(() => {
    if (!user) return;
    const loadSets = async () => {
      setLoadingSets(true);
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSets(data.map((s: any) => ({
          id: s.id,
          title: s.title,
          cards: (s.cards as any[]) || [],
          created_at: s.created_at,
        })));
      }
      setLoadingSets(false);
    };
    loadSets();
  }, [user]);

  const handleGenerate = async () => {
    const material = materials.find(m => m.id === selectedMaterialId);
    const content = material?.content || customContent;

    if (!content.trim()) {
      toast.error(t('يرجى اختيار مادة أو إدخال محتوى', 'Please select a material or enter content'));
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: {
          content,
          title: material?.file_name || t('بطاقات مخصصة', 'Custom Flashcards'),
          language,
          count: parseInt(cardCount),
          subject: profile?.subject || 'general',
          subjectName: getSubjectName(profile?.subject || 'general', language),
        },
      });

      if (error) throw error;

      const cards = data.cards || [];
      if (cards.length === 0) {
        toast.error(t('لم يتم إنشاء بطاقات', 'No flashcards generated'));
        return;
      }

      // Save to database
      const { data: saved, error: saveError } = await supabase
        .from('flashcard_sets')
        .insert({
          user_id: user!.id,
          title: data.title,
          cards: cards,
          source_material_id: selectedMaterialId || null,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      const newSet: FlashcardSet = {
        id: saved.id,
        title: saved.title,
        cards: saved.cards as any[],
        created_at: saved.created_at,
      };

      setSets(prev => [newSet, ...prev]);
      setActiveSet(newSet);
      setCurrentIndex(0);
      setFlipped(false);
      toast.success(t(`تم إنشاء ${cards.length} بطاقة`, `Generated ${cards.length} flashcards`));
    } catch (err) {
      console.error('Flashcard generation error:', err);
      toast.error(t('حدث خطأ في إنشاء البطاقات', 'Error generating flashcards'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (setId: string) => {
    const { error } = await supabase
      .from('flashcard_sets')
      .delete()
      .eq('id', setId);

    if (!error) {
      setSets(prev => prev.filter(s => s.id !== setId));
      if (activeSet?.id === setId) {
        setActiveSet(null);
        setCurrentIndex(0);
      }
      toast.success(t('تم حذف المجموعة', 'Set deleted'));
    }
  };

  const difficultyColors = {
    easy: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    medium: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    hard: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  };

  // Study mode
  if (activeSet) {
    const card = activeSet.cards[currentIndex];
    return (
      <div className="flex flex-col h-full p-4 sm:p-6 overflow-y-auto" dir={dir}>
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => { setActiveSet(null); setCurrentIndex(0); setFlipped(false); }}>
            {language === 'ar' ? <ChevronRight className="w-4 h-4 ml-1" /> : <ChevronLeft className="w-4 h-4 mr-1" />}
            {t('العودة', 'Back')}
          </Button>
          <h2 className="font-semibold text-foreground">{activeSet.title}</h2>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {activeSet.cards.length}
          </span>
        </div>

        {/* Flashcard */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div
            className="w-full max-w-lg cursor-pointer perspective-1000"
            onClick={() => setFlipped(!flipped)}
          >
            <Card className={cn(
              'relative min-h-[280px] sm:min-h-[320px] p-8 flex flex-col items-center justify-center text-center transition-all duration-500 transform',
              flipped ? 'bg-primary/5 border-primary/30' : 'bg-card hover:shadow-lg',
            )}>
              {card && (
                <>
                  <span className={cn('text-xs px-2 py-1 rounded-full absolute top-4 end-4', difficultyColors[card.difficulty])}>
                    {card.difficulty}
                  </span>
                  <p className="text-lg sm:text-xl font-medium text-foreground leading-relaxed">
                    {flipped ? card.back : card.front}
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    {flipped ? t('الإجابة', 'Answer') : t('اضغط للقلب', 'Tap to flip')}
                  </p>
                </>
              )}
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="icon"
            disabled={currentIndex === 0}
            onClick={() => { setCurrentIndex(prev => prev - 1); setFlipped(false); }}
          >
            {language === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFlipped(!flipped)}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={currentIndex === activeSet.cards.length - 1}
            onClick={() => { setCurrentIndex(prev => prev + 1); setFlipped(false); }}
          >
            {language === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 overflow-y-auto" dir={dir}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          {t('البطاقات التعليمية', 'Flashcards')}
        </h2>
        <p className="text-muted-foreground mt-2">
          {t('أنشئ بطاقات تعليمية ذكية من موادك الدراسية', 'Generate smart flashcards from your study materials')}
        </p>
      </div>

      {/* Generator */}
      <Card className="p-4 sm:p-6 mb-6">
        <h3 className="font-semibold mb-4">{t('إنشاء بطاقات جديدة', 'Generate New Cards')}</h3>

        <div className="space-y-4">
          {materials.length > 0 && (
            <Select value={selectedMaterialId} onValueChange={(v) => { setSelectedMaterialId(v); setCustomContent(''); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('اختر مادة دراسية', 'Select a material')} />
              </SelectTrigger>
              <SelectContent>
                {materials.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.file_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {!selectedMaterialId && (
            <Textarea
              value={customContent}
              onChange={e => setCustomContent(e.target.value)}
              placeholder={t('أو الصق المحتوى هنا...', 'Or paste content here...')}
              className="min-h-[100px]"
            />
          )}

          <div className="flex items-center gap-3">
            <Select value={cardCount} onValueChange={setCardCount}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 {t('بطاقات', 'cards')}</SelectItem>
                <SelectItem value="10">10 {t('بطاقات', 'cards')}</SelectItem>
                <SelectItem value="15">15 {t('بطاقات', 'cards')}</SelectItem>
                <SelectItem value="20">20 {t('بطاقات', 'cards')}</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              ) : (
                <Sparkles className="w-4 h-4 me-2" />
              )}
              {t('إنشاء البطاقات', 'Generate Cards')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Saved Sets */}
      <h3 className="font-semibold mb-3">{t('المجموعات المحفوظة', 'Saved Sets')}</h3>
      {loadingSets ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : sets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t('لا توجد مجموعات بعد', 'No sets yet')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sets.map(set => (
            <Card
              key={set.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => { setActiveSet(set); setCurrentIndex(0); setFlipped(false); }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-foreground">{set.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {set.cards.length} {t('بطاقة', 'cards')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(set.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDelete(set.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardFeature;
