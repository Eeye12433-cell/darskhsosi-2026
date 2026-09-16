import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Video, Send, Loader2, Play, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useUserProgress } from '@/hooks/useUserProgress';
import ExportButtons from './chat/ExportButtons';

interface VideoLearningProps {
  language: 'ar' | 'en';
}

const VideoLearning: React.FC<VideoLearningProps> = ({ language }) => {
  const { profile } = useProfile();
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const subjectId = videoId ? `video_${videoId}` : null;
  const { messages, addMessage, loading: messagesLoading } = useChatMessages(subjectId);
  const { progress, saveProgress } = useUserProgress('video' as any);

  // Load progress
  useEffect(() => {
    if (progress?.videoUrl && progress?.videoId) {
      setVideoUrl(progress.videoUrl);
      setVideoId(progress.videoId);
    }
  }, [progress]);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { ar: 'التعلم بالفيديو', en: 'Learn with Video' },
      subtitle: { ar: 'شاهد فيديو يوتيوب واسأل عن محتواه', en: 'Watch a YouTube video and ask questions about it' },
      urlPlaceholder: { ar: 'الصق رابط فيديو يوتيوب هنا...', en: 'Paste YouTube video URL here...' },
      load: { ar: 'تحميل الفيديو', en: 'Load Video' },
      askPlaceholder: { ar: 'اسأل سؤالاً عن الفيديو...', en: 'Ask a question about the video...' },
      send: { ar: 'أرسل', en: 'Send' },
      greeting: { ar: 'مرحباً! شاهد الفيديو ثم اسألني أي سؤال عن محتواه.', en: 'Hello! Watch the video and then ask me any question about its content.' },
      invalidUrl: { ar: 'رابط يوتيوب غير صالح', en: 'Invalid YouTube URL' },
    };
    return translations[key]?.[language] || key;
  };

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /youtube\.com\/shorts\/([^&\s?]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleLoadVideo = () => {
    const id = extractVideoId(videoUrl);
    if (id) {
      setVideoId(id);
      saveProgress({ videoUrl, videoId: id });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !videoId) return;

    const userMessage = input.trim();
    const { validateMessage } = await import('@/utils/inputValidation');
    const validation = validateMessage(userMessage, language);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    // Save user message
    await addMessage({
      role: 'user',
      content: userMessage,
      subject_id: subjectId
    });

    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intelligent-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant discussing a YouTube video. The user is watching: https://youtube.com/watch?v=${videoId}. Help them understand the video content, answer questions about it, and provide additional context. Be educational and engaging. Respond in ${language === 'ar' ? 'Arabic' : 'English'}.`,
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage },
          ],
          learnerProfile: profile ? {
            name: profile.name,
            educationLevel: profile.education_level,
            learningStyle: profile.learning_style,
            interests: profile.interests,
            preferredLanguage: profile.preferred_language,
          } : null,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(language === 'ar' ? 'تم تجاوز الحد المسموح، حاول لاحقاً' : 'Rate limit exceeded, try again later');
        } else if (response.status === 402) {
          toast.error(language === 'ar' ? 'يجب إضافة رصيد للحساب' : 'Please add credits to your account');
        } else {
          toast.error(language === 'ar' ? 'حدث خطأ في الخدمة' : 'Service error occurred');
        }
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                fullContent += content;
                setStreamingContent(fullContent);
              } catch { }
            }
          }
        }
      }

      // Save assistant message
      if (fullContent) {
        await addMessage({
          role: 'assistant',
          content: fullContent,
          subject_id: subjectId
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(language === 'ar' ? 'تعذر الاتصال بالخدمة' : 'Could not reach the service');
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden p-3 sm:p-4 md:p-6 gsap-theme-animate">
      <div className="relative shrink-0 flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex-1 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        {messages.length > 0 && (
          <div className="shrink-0 absolute top-4 end-4">
            <ExportButtons
              language={language}
              messages={messages.map(m => ({ role: m.role, content: m.content }))}
              title={`${t('title')} - ${videoId}`}
            />
          </div>
        )}
      </div>

      {!videoId ? (
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder={t('urlPlaceholder')}
              className="flex-1 text-sm"
              dir="ltr"
            />
            <Button onClick={handleLoadVideo} disabled={!videoUrl.trim()} className="w-full sm:w-auto">
              <Play className="w-4 h-4 me-2" />
              {t('load')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 overflow-hidden">
          <Card className="overflow-hidden shrink-0">
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>

          <Card className="flex-1 min-h-[220px] flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 min-h-0 basis-0 p-3 sm:p-4">
              {messages.length === 0 && !streamingContent && (
                <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                    <AvatarFallback><MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-2.5 sm:p-3 max-w-[85%] sm:max-w-[80%]">
                    <p className="text-sm">{t('greeting')}</p>
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={message.id || index} className={`flex gap-2 sm:gap-3 mb-3 sm:mb-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                    <AvatarFallback>
                      {message.role === 'user' ? '👤' : <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`rounded-lg p-2.5 sm:p-3 max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ))}
              {streamingContent && (
                <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                    <AvatarFallback><MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-2.5 sm:p-3 max-w-[85%] sm:max-w-[80%]">
                    <p className="text-sm whitespace-pre-wrap break-words">{streamingContent}</p>
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="p-2 sm:p-4 border-t shrink-0">
              <div className="flex gap-1.5 sm:gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('askPlaceholder')}
                  className="min-h-[44px] max-h-[100px] sm:max-h-[120px] resize-none text-sm"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="h-10 w-10 sm:h-11 sm:w-11 shrink-0">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>

          <Button variant="outline" onClick={() => {
            setVideoId('');
            saveProgress({ videoUrl: '', videoId: '' });
          }} className="shrink-0">
            {language === 'ar' ? 'تغيير الفيديو' : 'Change Video'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoLearning;

