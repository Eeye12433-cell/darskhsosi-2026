import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Baby, Calculator, Hash, Link2, Palette, Puzzle, RefreshCw, Shapes, Sparkles } from 'lucide-react';

type GameMode = 'math' | 'letters' | 'shapes' | 'counting' | 'coloring';
type PaletteTone = 'primary' | 'accent' | 'secondary' | 'muted' | 'destructive';

interface KidsLearningGamesProps {
  language: 'ar' | 'en';
}

interface MathPuzzle {
  left: number;
  right: number;
  operation: '+' | '-';
  answer: number;
  options: number[];
}

interface LetterPair {
  letter: string;
  word: string;
  emoji: string;
}

const shuffleArray = <T,>(items: T[]): T[] => {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

// Age-appropriate for under 7: numbers stay within 1..10
const generateMathPuzzle = (): MathPuzzle => {
  const operation: '+' | '-' = Math.random() > 0.5 ? '+' : '-';
  let left: number;
  let right: number;
  if (operation === '+') {
    left = Math.floor(Math.random() * 5) + 1;
    right = Math.floor(Math.random() * (10 - left)) + 1;
  } else {
    left = Math.floor(Math.random() * 9) + 2;
    right = Math.floor(Math.random() * left) + 1;
  }
  const answer = operation === '+' ? left + right : left - right;

  const distractors = new Set<number>();
  while (distractors.size < 2) {
    const jitter = Math.floor(Math.random() * 5) - 2;
    const candidate = Math.max(0, Math.min(10, answer + jitter));
    if (candidate !== answer) distractors.add(candidate);
  }

  return {
    left,
    right,
    operation,
    answer,
    options: shuffleArray([answer, ...Array.from(distractors)]),
  };
};

const toneClassMap: Record<PaletteTone, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  secondary: 'bg-secondary',
  muted: 'bg-muted',
  destructive: 'bg-destructive',
};

const SHAPES = [
  { id: 'circle', emoji: '🔵', ar: 'دائرة', en: 'Circle' },
  { id: 'square', emoji: '🟧', ar: 'مربع', en: 'Square' },
  { id: 'triangle', emoji: '🔺', ar: 'مثلث', en: 'Triangle' },
  { id: 'star', emoji: '⭐', ar: 'نجمة', en: 'Star' },
  { id: 'heart', emoji: '❤️', ar: 'قلب', en: 'Heart' },
  { id: 'moon', emoji: '🌙', ar: 'هلال', en: 'Moon' },
];

const COUNT_EMOJIS = ['🍎', '🐥', '🎈', '🌸', '🐞', '🍓', '⚽', '🦋'];

const KidsLearningGames: React.FC<KidsLearningGamesProps> = ({ language }) => {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const [activeGame, setActiveGame] = useState<GameMode>('math');
  const [stars, setStars] = useState(0);

  // Math puzzle state
  const [mathPuzzle, setMathPuzzle] = useState<MathPuzzle>(() => generateMathPuzzle());
  const [mathFeedback, setMathFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [mathScore, setMathScore] = useState(0);
  const [mathRounds, setMathRounds] = useState(0);

  // Letter connect state
  const letterPairs = useMemo<LetterPair[]>(() => {
    return language === 'ar'
      ? [
          { letter: 'أ', word: 'أسد', emoji: '🦁' },
          { letter: 'ب', word: 'بطة', emoji: '🦆' },
          { letter: 'ت', word: 'تفاح', emoji: '🍎' },
          { letter: 'س', word: 'سمك', emoji: '🐟' },
        ]
      : [
          { letter: 'A', word: 'Apple', emoji: '🍎' },
          { letter: 'B', word: 'Ball', emoji: '⚽' },
          { letter: 'C', word: 'Cat', emoji: '🐱' },
          { letter: 'D', word: 'Duck', emoji: '🦆' },
        ];
  }, [language]);

  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [letterConnections, setLetterConnections] = useState<Record<string, string>>({});
  const [wordChoices, setWordChoices] = useState<LetterPair[]>([]);

  // Shapes matching state
  const [shapeRound, setShapeRound] = useState(() => shuffleArray(SHAPES).slice(0, 4));
  const [shapeTarget, setShapeTarget] = useState(() => SHAPES[Math.floor(Math.random() * SHAPES.length)]);
  const [shapeFeedback, setShapeFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [shapeScore, setShapeScore] = useState(0);

  // Counting state
  const [countEmoji, setCountEmoji] = useState(() => COUNT_EMOJIS[0]);
  const [countValue, setCountValue] = useState(() => Math.floor(Math.random() * 8) + 1);
  const [countFeedback, setCountFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [countScore, setCountScore] = useState(0);

  // Coloring state
  const [selectedTone, setSelectedTone] = useState<PaletteTone>('primary');
  const [paintGrid, setPaintGrid] = useState<Array<PaletteTone | null>>(() => Array(48).fill(null));
  const [paintGoal, setPaintGoal] = useState(() => Math.floor(Math.random() * 9) + 8);

  useEffect(() => {
    setWordChoices(shuffleArray(letterPairs));
    setLetterConnections({});
    setSelectedLetter(null);
  }, [letterPairs]);

  const addStar = () => setStars((prev) => prev + 1);

  const handleMathAnswer = (value: number) => {
    const isCorrect = value === mathPuzzle.answer;
    setMathRounds((prev) => prev + 1);
    if (isCorrect) {
      setMathScore((prev) => prev + 1);
      setMathFeedback('correct');
      addStar();
    } else {
      setMathFeedback('wrong');
    }
  };

  const nextMathPuzzle = () => {
    setMathPuzzle(generateMathPuzzle());
    setMathFeedback(null);
  };

  const handleWordPick = (word: string) => {
    if (!selectedLetter || letterConnections[selectedLetter]) return;
    const selectedPair = letterPairs.find((pair) => pair.letter === selectedLetter);
    if (!selectedPair) return;
    if (selectedPair.word === word) {
      setLetterConnections((prev) => ({ ...prev, [selectedLetter]: word }));
      addStar();
    }
    setSelectedLetter(null);
  };

  const resetLetterGame = () => {
    setLetterConnections({});
    setSelectedLetter(null);
    setWordChoices(shuffleArray(letterPairs));
  };

  const nextShapeRound = () => {
    const round = shuffleArray(SHAPES).slice(0, 4);
    setShapeRound(round);
    setShapeTarget(round[Math.floor(Math.random() * round.length)]);
    setShapeFeedback(null);
  };

  const handleShapePick = (id: string) => {
    if (id === shapeTarget.id) {
      setShapeScore((prev) => prev + 1);
      setShapeFeedback('correct');
      addStar();
    } else {
      setShapeFeedback('wrong');
    }
  };

  const nextCountRound = () => {
    setCountEmoji(COUNT_EMOJIS[Math.floor(Math.random() * COUNT_EMOJIS.length)]);
    setCountValue(Math.floor(Math.random() * 8) + 1);
    setCountFeedback(null);
  };

  const handleCountPick = (value: number) => {
    if (value === countValue) {
      setCountScore((prev) => prev + 1);
      setCountFeedback('correct');
      addStar();
    } else {
      setCountFeedback('wrong');
    }
  };

  const handlePaintCell = (index: number) => {
    setPaintGrid((prev) => {
      const next = [...prev];
      next[index] = selectedTone;
      return next;
    });
  };

  const resetPaintGame = () => {
    setPaintGrid(Array(48).fill(null));
    setPaintGoal(Math.floor(Math.random() * 9) + 8);
  };

  const solvedLetters = Object.keys(letterConnections).length;
  const paintCount = paintGrid.filter(Boolean).length;
  const paintProgress = Math.min(100, (paintCount / paintGoal) * 100);

  const countOptions = useMemo(() => {
    const set = new Set<number>([countValue]);
    while (set.size < 3) set.add(Math.max(1, Math.min(9, countValue + Math.floor(Math.random() * 5) - 2)));
    return shuffleArray(Array.from(set));
  }, [countValue]);

  const games: Array<{ id: GameMode; icon: React.ReactNode; label: string }> = [
    { id: 'math', icon: <Calculator className="w-6 h-6" />, label: t('جمع وطرح', 'Add & Subtract') },
    { id: 'letters', icon: <Link2 className="w-6 h-6" />, label: t('توصيل الحروف', 'Letter Connect') },
    { id: 'shapes', icon: <Shapes className="w-6 h-6" />, label: t('مطابقة الأشكال', 'Shape Match') },
    { id: 'counting', icon: <Hash className="w-6 h-6" />, label: t('العدّ', 'Counting') },
    { id: 'coloring', icon: <Palette className="w-6 h-6" />, label: t('لوّن والعب', 'Color & Play') },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <Card className="border-2 border-primary/30 shadow-elegant overflow-hidden">
        <div className="h-2 w-full" style={{ background: 'var(--subject-gradient)' }} />
        <CardHeader className="space-y-3">
          <CardTitle className="flex flex-wrap items-center gap-2 text-2xl md:text-3xl text-foreground">
            <Puzzle className="w-7 h-7 text-primary" />
            {t('نلعب ونتعلم 🎈', "Let's Play & Learn 🎈")}
          </CardTitle>
          <CardDescription className="text-base">
            {t(
              'أنشطة ملوّنة وممتعة: حساب، حروف، أشكال، عدّ وتلوين.',
              'Colorful, playful activities: math, letters, shapes, counting and coloring.'
            )}
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="text-sm py-1.5 px-3 gap-2">
              <Baby className="w-4 h-4" />
              {t('مخصّصة للأطفال حتى سن 7 سنوات', 'Designed for children up to 7 years old')}
            </Badge>
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              ⭐ {t('نجومي', 'My stars')}: {stars}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              'ينصح بمشاركة أحد الوالدين أثناء اللعب. جميع الأنشطة آمنة وبدون روابط خارجية.',
              'Parental company is recommended. All activities are safe with no external links.'
            )}
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {games.map((game) => (
          <Button
            key={game.id}
            variant={activeGame === game.id ? 'default' : 'outline'}
            onClick={() => setActiveGame(game.id)}
            className="h-24 flex-col gap-2 rounded-2xl border-2 text-base font-bold transition-transform hover:scale-105"
          >
            {game.icon}
            {game.label}
          </Button>
        ))}
      </div>

      {activeGame === 'math' && (
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t('حل المسألة', 'Solve the Puzzle')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('اختر الرقم الصحيح.', 'Pick the correct number.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-3xl border-2 border-primary/30 bg-accent/40 p-6 text-center">
              <p className="text-5xl font-extrabold tracking-wide text-foreground" dir="ltr">
                {mathPuzzle.left} {mathPuzzle.operation} {mathPuzzle.right} = ?
              </p>
              <p className="mt-3 text-3xl" dir="ltr">
                {'🍎'.repeat(mathPuzzle.left)} {mathPuzzle.operation} {'🍏'.repeat(mathPuzzle.right)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {mathPuzzle.options.map((option) => (
                <Button
                  key={option}
                  variant="secondary"
                  className="h-20 text-3xl font-extrabold rounded-2xl border-2 hover:scale-105 transition-transform"
                  disabled={mathFeedback !== null}
                  onClick={() => handleMathAnswer(option)}
                >
                  {option}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {mathFeedback === 'correct' && <Badge className="text-base py-1.5 px-3">{t('أحسنت! 🎉', 'Well done! 🎉')}</Badge>}
              {mathFeedback === 'wrong' && <Badge variant="destructive" className="text-base py-1.5 px-3">{t('حاول مرة أخرى 💪', 'Try again 💪')}</Badge>}
              <Badge variant="secondary" className="text-base py-1.5 px-3">{t('النقاط', 'Score')}: {mathScore}/{mathRounds || 1}</Badge>
            </div>

            <Button onClick={nextMathPuzzle} className="gap-2 h-14 text-lg rounded-2xl w-full sm:w-auto px-8">
              <RefreshCw className="w-5 h-5" />
              {t('مسألة جديدة', 'Next Puzzle')}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeGame === 'letters' && (
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="text-xl">{t('وصّل الحرف بالصورة', 'Match Letter to Picture')}</CardTitle>
            <CardDescription className="text-base">
              {t('اختر حرفاً ثم اختر الصورة التي تبدأ به.', 'Pick a letter, then choose the picture that starts with it.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Progress value={(solvedLetters / letterPairs.length) * 100} className="h-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-base font-bold text-muted-foreground">{t('الحروف', 'Letters')}</p>
                <div className="grid grid-cols-2 gap-3">
                  {letterPairs.map((pair) => (
                    <Button
                      key={pair.letter}
                      variant={selectedLetter === pair.letter ? 'default' : 'outline'}
                      className="h-20 text-3xl font-extrabold rounded-2xl border-2"
                      disabled={Boolean(letterConnections[pair.letter])}
                      onClick={() => setSelectedLetter(pair.letter)}
                    >
                      {pair.letter}
                      {letterConnections[pair.letter] && <span className="ms-2 text-lg">✓</span>}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-base font-bold text-muted-foreground">{t('الصور', 'Pictures')}</p>
                <div className="grid grid-cols-2 gap-3">
                  {wordChoices.map((pair) => {
                    const alreadyUsed = Object.values(letterConnections).includes(pair.word);
                    return (
                      <Button
                        key={pair.word}
                        variant="secondary"
                        className="h-20 flex-col gap-1 rounded-2xl border-2 text-base font-bold"
                        disabled={!selectedLetter || alreadyUsed}
                        onClick={() => handleWordPick(pair.word)}
                      >
                        <span className="text-3xl">{pair.emoji}</span>
                        {pair.word}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-base py-1.5 px-3">
                {t('المطابقات', 'Matches')}: {solvedLetters}/{letterPairs.length}
              </Badge>
              <Button variant="outline" onClick={resetLetterGame} className="gap-2 h-12 rounded-2xl text-base">
                <RefreshCw className="w-5 h-5" />
                {t('إعادة اللعب', 'Reset Game')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeGame === 'shapes' && (
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="text-xl">{t('مطابقة الأشكال', 'Shape Match')}</CardTitle>
            <CardDescription className="text-base">
              {t('اضغط على الشكل المطلوب.', 'Tap the shape we ask for.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-3xl border-2 border-primary/30 bg-accent/40 p-6 text-center space-y-2">
              <p className="text-lg font-bold text-foreground">
                {t('أين', 'Where is the')} {language === 'ar' ? shapeTarget.ar : shapeTarget.en}{t('؟', '?')}
              </p>
              <p className="text-5xl">{shapeTarget.emoji}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {shapeRound.map((shape) => (
                <Button
                  key={shape.id}
                  variant="secondary"
                  className="h-28 flex-col gap-1 rounded-2xl border-2 text-base font-bold hover:scale-105 transition-transform"
                  disabled={shapeFeedback === 'correct'}
                  onClick={() => handleShapePick(shape.id)}
                >
                  <span className="text-4xl">{shape.emoji}</span>
                  {language === 'ar' ? shape.ar : shape.en}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {shapeFeedback === 'correct' && <Badge className="text-base py-1.5 px-3">{t('رائع! 🌟', 'Awesome! 🌟')}</Badge>}
              {shapeFeedback === 'wrong' && <Badge variant="destructive" className="text-base py-1.5 px-3">{t('جرّب مرة أخرى', 'Try again')}</Badge>}
              <Badge variant="secondary" className="text-base py-1.5 px-3">{t('النقاط', 'Score')}: {shapeScore}</Badge>
              <Button onClick={nextShapeRound} className="gap-2 h-12 rounded-2xl text-base px-6">
                <RefreshCw className="w-5 h-5" />
                {t('جولة جديدة', 'New Round')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeGame === 'counting' && (
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="text-xl">{t('عُدّ الأشياء', 'Count the Objects')}</CardTitle>
            <CardDescription className="text-base">
              {t('كم عدد الأشياء في الصورة؟', 'How many objects do you see?')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-3xl border-2 border-primary/30 bg-accent/40 p-6 flex flex-wrap justify-center gap-2">
              {Array.from({ length: countValue }).map((_, index) => (
                <span key={index} className="text-4xl md:text-5xl">{countEmoji}</span>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {countOptions.map((option) => (
                <Button
                  key={option}
                  variant="secondary"
                  className="h-20 text-3xl font-extrabold rounded-2xl border-2 hover:scale-105 transition-transform"
                  disabled={countFeedback === 'correct'}
                  onClick={() => handleCountPick(option)}
                >
                  {option}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {countFeedback === 'correct' && <Badge className="text-base py-1.5 px-3">{t('صحيح! 🎉', 'Correct! 🎉')}</Badge>}
              {countFeedback === 'wrong' && <Badge variant="destructive" className="text-base py-1.5 px-3">{t('عُدّ مرة أخرى 🙂', 'Count again 🙂')}</Badge>}
              <Badge variant="secondary" className="text-base py-1.5 px-3">{t('النقاط', 'Score')}: {countScore}</Badge>
              <Button onClick={nextCountRound} className="gap-2 h-12 rounded-2xl text-base px-6">
                <RefreshCw className="w-5 h-5" />
                {t('صورة جديدة', 'New Picture')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeGame === 'coloring' && (
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="text-xl">{t('لوّن المربعات', 'Color the Squares')}</CardTitle>
            <CardDescription className="text-base">
              {t('الهدف: لوّن', 'Goal: color')} {paintGoal} {t('مربعات أو أكثر.', 'squares or more.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Progress value={paintProgress} className="h-3" />

            <div className="flex items-center gap-2 flex-wrap">
              {(Object.keys(toneClassMap) as PaletteTone[]).map((tone) => (
                <Button
                  key={tone}
                  variant={selectedTone === tone ? 'default' : 'outline'}
                  onClick={() => setSelectedTone(tone)}
                  className="gap-2 h-12 rounded-2xl border-2 text-base"
                >
                  <span className={cn('w-5 h-5 rounded-full border border-border', toneClassMap[tone])} />
                  {t(
                    tone === 'primary' ? 'رئيسي' : tone === 'accent' ? 'بارز' : tone === 'secondary' ? 'ثانوي' : tone === 'muted' ? 'هادئ' : 'قوي',
                    tone === 'primary' ? 'Primary' : tone === 'accent' ? 'Accent' : tone === 'secondary' ? 'Secondary' : tone === 'muted' ? 'Muted' : 'Strong'
                  )}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 rounded-3xl border-2 border-border p-3 bg-muted/20">
              {paintGrid.map((tone, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    'aspect-square rounded-xl border-2 border-border transition-transform duration-150 hover:scale-110',
                    tone ? toneClassMap[tone] : 'bg-card hover:bg-muted/70'
                  )}
                  onClick={() => handlePaintCell(index)}
                  aria-label={`${t('تلوين مربع', 'Color cell')} ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-base py-1.5 px-3">{t('المربعات الملوّنة', 'Painted')}: {paintCount}</Badge>
              {paintCount >= paintGoal && <Badge className="text-base py-1.5 px-3">{t('ممتاز! أكملت التحدي 🎨', 'Great! Challenge completed 🎨')}</Badge>}
              <Button variant="outline" onClick={resetPaintGame} className="gap-2 h-12 rounded-2xl text-base">
                <RefreshCw className="w-5 h-5" />
                {t('لوحة جديدة', 'New Board')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KidsLearningGames;
