import React, { useState } from 'react';
import { Conversation } from '@/hooks/useConversations';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Plus, MessageSquare, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface ConversationSwitcherProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  language: 'ar' | 'en';
  subjectLabel?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

const ConversationSwitcher: React.FC<ConversationSwitcherProps> = ({
  conversations,
  activeConversation,
  language,
  subjectLabel,
  onSelect,
  onNew,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <div className="border-b border-border bg-card/30" dir={dir}>
      {/* Compact bar */}
      <div className="flex items-center gap-2 px-3 py-2">
        {subjectLabel && (
          <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold px-2 py-1 shrink-0">
            {subjectLabel}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start gap-2 text-xs h-8 truncate"
          onClick={() => setExpanded(!expanded)}
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {activeConversation?.title || t('محادثة جديدة', 'New conversation')}
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 ms-auto shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 ms-auto shrink-0" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs shrink-0"
          onClick={onNew}
        >
          <Plus className="w-3.5 h-3.5" />
          {t('جديدة', 'New')}
        </Button>
      </div>

      {/* Expanded list */}
      {expanded && conversations.length > 0 && (
        <ScrollArea className="max-h-48 border-t border-border">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors group',
                  conv.id === activeConversation?.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted text-muted-foreground'
                )}
                onClick={() => {
                  onSelect(conv.id);
                  setExpanded(false);
                }}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate flex-1">{conv.title}</span>
                <span className="text-[10px] opacity-50 shrink-0">
                  {new Date(conv.updated_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ConversationSwitcher;
