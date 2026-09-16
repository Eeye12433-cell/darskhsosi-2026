import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link2, Loader2, Send, Globe, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Profile } from '@/hooks/useProfile';
import { useUserProgress } from '@/hooks/useUserProgress';
import ExportButtons from './chat/ExportButtons';

interface WebLinkExplainerProps {
  language: 'ar' | 'en';
  profile?: Profile;
}

const WebLinkExplainer: React.FC<WebLinkExplainerProps> = ({ language, profile }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const { progress, saveProgress } = useUserProgress('weblink' as any);

  // Load progress
  useEffect(() => {
    if (progress?.url && progress?.explanation) {
      setUrl(progress.url);
      setExplanation(progress.explanation);
    }
  }, [progress]);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const handleExplain = async () => {
    if (!url.trim()) {
      toast.error(t('الرجاء إدخال رابط', 'Please enter a URL'));
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error(t('الرجاء إدخال رابط صالح', 'Please enter a valid URL'));
      return;
    }

    setIsLoading(true);
    setExplanation(null);

    try {
      const { data, error } = await supabase.functions.invoke('explain-link', {
        body: {
          url,
          language,
          educationLevel: profile?.education_level || 'high',
          learningStyle: profile?.learning_style || 'visual',
          subject: profile?.subject || 'general'
        }
      });

      if (error) throw error;

      if (data?.explanation) {
        setExplanation(data.explanation);
        saveProgress({ url, explanation: data.explanation });
      } else {
        throw new Error('No explanation received');
      }
    } catch (error: any) {
      console.error('Error explaining link:', error);
      toast.error(t('حدث خطأ في تحليل الرابط', 'Error analyzing the link'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden p-3 sm:p-4 md:p-6 gsap-theme-animate">
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="border-b shrink-0 p-3 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                {t('شرح الروابط والمواقع', 'Web Link Explainer')}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t(
                  'أدخل أي رابط لموقع أو مقال وسيقوم الذكاء الاصطناعي بتحليله وشرحه لك',
                  'Enter any website or article link and AI will analyze and explain it for you'
                )}
              </p>
            </div>
            {explanation && (
              <div className="shrink-0">
                <ExportButtons
                  language={language}
                  content={explanation}
                  title={t('شرح الرابط', 'Link Explanation')}
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 p-3 sm:p-6 pt-3 sm:pt-4">
          {/* URL Input */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <div className="relative flex-1">
              <Link2 className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('https://example.com/article', 'https://example.com/article')}
                className="ps-10"
                dir="ltr"
                onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
              />
            </div>
            <Button onClick={handleExplain} disabled={isLoading} className="w-full sm:w-auto shrink-0">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 me-2" />
                  {t('تحليل', 'Analyze')}
                </>
              )}
            </Button>
          </div>

          {/* Explanation Result */}
          {explanation && (
            <ScrollArea className="flex-1 min-h-0 basis-0 border rounded-lg p-3 sm:p-4 bg-muted/30">
              <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b">
                <div className="flex items-center gap-2 min-w-0">
                  <ExternalLink className="w-4 h-4 text-primary shrink-0" />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate"
                  >
                    {url}
                  </a>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setExplanation(null);
                  setUrl('');
                  saveProgress({ url: '', explanation: '' });
                }}>
                  {t('مسح', 'Clear')}
                </Button>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {explanation}
              </div>
            </ScrollArea>
          )}

          {/* Empty State */}
          {!explanation && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Globe className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-center">
                {t(
                  'أدخل رابط أي موقع أو مقال للحصول على شرح مبسط',
                  'Enter any website or article URL to get a simplified explanation'
                )}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                {t('جاري تحليل المحتوى...', 'Analyzing content...')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebLinkExplainer;

