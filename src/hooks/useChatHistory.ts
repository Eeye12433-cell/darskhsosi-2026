import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useChatHistory = (featureId: string, conversationId?: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    if (!user || !conversationId) { 
      setMessages([]);
      setLoading(false); 
      return; 
    }
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      if (data) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at)
        })));
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  }, [user, conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const saveMessage = useCallback(async (message: ChatMessage) => {
    if (!user || !conversationId) return;
    try {
      await (supabase as any).from('chat_messages').insert({
        user_id: user.id,
        role: message.role,
        content: message.content,
        conversation_id: conversationId,
      });
      // Update conversation's updated_at
      await (supabase as any)
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  }, [user, conversationId]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    saveMessage(message);
  }, [saveMessage]);

  const clearHistory = useCallback(async () => {
    setMessages([]);
  }, []);

  return { messages, setMessages, addMessage, loading, clearHistory, loadMessages };
};
