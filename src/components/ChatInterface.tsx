import React, { useState, useRef, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useConversations } from '@/hooks/useConversations';
import { useChatHistory, ChatMessage } from '@/hooks/useChatHistory';
import { useUploadedMaterials } from '@/hooks/useUploadedMaterials';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import MaterialSelector from '@/components/chat/MaterialSelector';
import ConversationSwitcher from '@/components/chat/ConversationSwitcher';
import { Send, Paperclip, Bot, User, Sparkles, Upload, Loader2 } from 'lucide-react';
import { useUserProgress } from '@/hooks/useUserProgress';
import ExportButtons from '@/components/chat/ExportButtons';
import { validateMessage } from '@/utils/inputValidation';

interface ChatInterfaceProps {
  profile: Profile;
  language: 'ar' | 'en';
  onNavigateToUpload: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ profile, language, onNavigateToUpload }) => {
  const {
    conversations,
    activeConversation,
    loading: convsLoading,
    createConversation,
    switchConversation,
    deleteConversation,
  } = useConversations('teacher');

  const {
    messages: dbMessages,
    loading: messagesLoading,
    addMessage,
  } = useChatHistory('teacher', activeConversation?.id);

  const { materials } = useUploadedMaterials();
  const { progress, saveProgress } = useUserProgress('teacher');

  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const lastConvId = useRef<string | null>(null);

  // Sync messages from DB
  useEffect(() => {
    if (!messagesLoading) {
      if (activeConversation?.id !== lastConvId.current) {
        lastConvId.current = activeConversation?.id || null;
        setMessages(dbMessages);
      } else if (dbMessages.length > 0 && messages.length === 0) {
        setMessages(dbMessages);
      }
    }
  }, [messagesLoading, dbMessages, activeConversation?.id]);

  useEffect(() => {
    if (progress && progress.selectedMaterials && selectedMaterials.length === 0) {
      setSelectedMaterials(progress.selectedMaterials);
    }
  }, [progress]);

  useEffect(() => {
    if (selectedMaterials.length > 0) {
      saveProgress({ selectedMaterials });
    }
  }, [selectedMaterials]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      ar: {
        'sidebar.teacher': 'المعلم الذكي',
        'app.tagline': 'منصة التعلم المفتوح بالذكاء الاصطناعي',
        'app.welcome': 'مرحباً بك في رحلة التعلم',
        'chat.placeholder': 'اكتب سؤالك هنا...',
        'chat.thinking': 'يفكر...',
        'sidebar.upload': 'رفع المواد'
      },
      en: {
        'sidebar.teacher': 'Intelligent Teacher',
        'app.tagline': 'AI-Powered Open Learning Platform',
        'app.welcome': 'Welcome to Your Learning Journey',
        'chat.placeholder': 'Type your question here...',
        'chat.thinking': 'Thinking...',
        'sidebar.upload': 'Upload Materials'
      }
    };
    return translations[language][key] || key;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleNewConversation = async () => {
    const conv = await createConversation();
    if (conv) {
      setMessages([]);
      lastConvId.current = conv.id;
    }
  };

  const handleSwitchConversation = async (convId: string) => {
    await switchConversation(convId);
    setMessages([]);
    lastConvId.current = convId;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userInput = input.trim();
    const validation = validateMessage(userInput, language);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Auto-create conversation if none
    let convId = activeConversation?.id;
    if (!convId) {
      const conv = await createConversation(userInput.substring(0, 50));
      if (!conv) return;
      convId = conv.id;
      lastConvId.current = conv.id;
    }

    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    const userMsg = { id: Date.now().toString(), role: 'user' as const, content: userInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    addMessage(userMsg);

    // Auto-title
    if (messages.length === 0) {
      try {
        await (supabase as any).from('conversations').update({ title: userInput.substring(0, 60) }).eq('id', convId);
      } catch {}
    }

    try {
      const selectedMaterialNames = materials.filter(m => selectedMaterials.includes(m.id)).map(m => m.file_name);
      const materialContext = materials
        .filter(m => selectedMaterials.includes(m.id))
        .map(m => `### Document: ${m.file_name}\n${(m.content || '').substring(0, 10000)}`)
        .join('\n\n---\n\n');

      const messageHistory = [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user' as const, content: userInput }];

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error(language === 'ar' ? 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.' : 'Session expired. Please log in again.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intelligent-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          messages: messageHistory,
          learnerProfile: {
            name: profile.name,
            educationLevel: profile.education_level,
            learningStyle: profile.learning_style,
            learningStyles: profile.learning_styles,
            preferredLanguage: profile.preferred_language,
            hobbies: profile.hobbies,
            goals: profile.goals,
            strengths: profile.strengths,
            weaknesses: profile.weaknesses
          },
          uploadedMaterials: selectedMaterialNames.length > 0 ? selectedMaterialNames : materials.map(m => m.file_name),
          materialContent: materialContext
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error:', response.status, errorText);
        if (response.status === 429 || response.status === 402) {
          toast.error(language === 'ar' ? 'تم تجاوز حد الاستخدام المجاني.' : 'Free usage limit exceeded.', { duration: 6000 });
        } else {
          toast.error(language === 'ar' ? 'حدث خطأ في الخدمة.' : 'Service error.');
        }
        setIsLoading(false);
        return;
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { fullContent += content; setStreamingContent(fullContent); }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (fullContent) {
        const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: fullContent, timestamp: new Date() };
        setMessages(prev => [...prev, aiMsg]);
        addMessage(aiMsg);
      }
      setStreamingContent('');
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (messagesLoading && convsLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full gsap-theme-animate">
      {/* Chat Header */}
      <div className="p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="heading-4 text-foreground truncate">{t('sidebar.teacher')}</h2>
              <p className="caption truncate">{t('app.tagline')}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <div className="shrink-0">
              <ExportButtons language={language} messages={messages.map(m => ({ role: m.role, content: m.content }))} title={t('sidebar.teacher')} />
            </div>
          )}
        </div>
      </div>

      {/* Conversation Switcher */}
      <ConversationSwitcher
        conversations={conversations}
        activeConversation={activeConversation}
        language={language}
        onSelect={handleSwitchConversation}
        onNew={handleNewConversation}
        onDelete={(id) => deleteConversation(id)}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar">
        {messages.length === 0 && !streamingContent ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-secondary flex items-center justify-center mb-4 sm:mb-6 animate-float">
              <Sparkles className="w-7 h-7 sm:w-10 sm:h-10 text-primary" />
            </div>
            <h3 className="heading-3 text-foreground mb-2">{t('app.welcome')}</h3>
            <p className="body-sm text-muted-foreground max-w-md mb-2">
              {language === 'ar' ? `مرحباً ${profile.name}! أنا معلمك الذكي.` : `Hello ${profile.name}! I'm your intelligent teacher.`}
            </p>
            {materials.length === 0 && (
              <Button className="mt-4 sm:mt-6 gradient-accent" size="default" onClick={onNavigateToUpload}>
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 me-2" />{t('sidebar.upload')}
              </Button>
            )}
          </div>
        ) : (
          <>
            {messages.map(message => (
              <div key={message.id} className={cn('flex gap-2 sm:gap-3 animate-slide-up', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn('w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0', message.role === 'user' ? 'gradient-accent' : 'gradient-primary')}>
                  {message.role === 'user' ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-foreground" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />}
                </div>
                <div className={cn('max-w-[88%] sm:max-w-[75%] px-3 py-2 sm:px-4 sm:py-3', message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai')}>
                  <p className="body-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <span className="caption opacity-60 mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString(dir === 'rtl' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {streamingContent && (
              <div className="flex gap-2 sm:gap-3 animate-slide-up">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                </div>
                <div className="chat-bubble-ai max-w-[88%] sm:max-w-[75%] px-3 py-2 sm:px-4 sm:py-3">
                  <p className="body-sm whitespace-pre-wrap break-words">{streamingContent}</p>
                </div>
              </div>
            )}
          </>
        )}
        {isLoading && !streamingContent && (
          <div className="flex gap-2 sm:gap-3 animate-slide-up">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full gradient-primary flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <div className="chat-bubble-ai px-3 py-2 sm:px-4 sm:py-3">
              <div className="flex items-center gap-2">
                <span className="body-sm text-muted-foreground">{t('chat.thinking')}</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse-soft" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse-soft" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse-soft" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-border bg-card/50 backdrop-blur-sm space-y-2 sm:space-y-3">
        <div data-helper-target="material-selector">
          <MaterialSelector language={language} selectedMaterials={selectedMaterials} onSelectionChange={setSelectedMaterials} maxSelection={5} />
        </div>
        <div className="flex items-end gap-1.5 sm:gap-3">
          <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl" onClick={onNavigateToUpload}>
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div className="flex-1 relative" data-helper-target="chat-input">
            <Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={t('chat.placeholder')} className="min-h-[44px] sm:min-h-[48px] max-h-[100px] sm:max-h-[150px] resize-none pe-12 rounded-xl text-sm" rows={1} disabled={isLoading} />
          </div>
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl gradient-primary hover:opacity-90 transition-opacity" size="icon">
            <Send className={cn("w-4 h-4 sm:w-5 sm:h-5 my-px mx-[5px]", dir === 'rtl' && 'rotate-180')} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
