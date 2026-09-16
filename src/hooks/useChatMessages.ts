import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  user_id: string;
  subject_id: string | null;
  role: 'user' | 'assistant';
  content: string;
  attachments: string[] | null;
  created_at: string;
  conversation_id?: string | null;
}

const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const useChatMessages = (subjectId?: string | null, conversationId?: string | null) => {
  const { user } = useAuth();
  
  const isLocalOnly = !!subjectId && !isValidUUID(subjectId);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(!isLocalOnly);

  useEffect(() => {
    if (isLocalOnly) return;
    if (user) {
      fetchMessages();
      const unsubscribe = subscribeToMessages();
      return () => unsubscribe();
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [user, subjectId, conversationId]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      let query = (supabase as any)
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      } else if (subjectId) {
        query = query.eq('subject_id', subjectId);
      } else {
        query = query.is('subject_id', null).is('conversation_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data as ChatMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat-messages-${conversationId || subjectId || 'general'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          if (conversationId && newMessage.conversation_id !== conversationId) return;
          if (!conversationId && subjectId !== undefined && newMessage.subject_id !== subjectId) return;
          setMessages((prev) => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addMessage = async (message: { 
    role: 'user' | 'assistant'; 
    content: string; 
    subject_id?: string | null;
    attachments?: string[];
    conversation_id?: string | null;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    if (isLocalOnly) {
      const localMessage: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        role: message.role,
        content: message.content,
        subject_id: message.subject_id || null,
        attachments: message.attachments || null,
        created_at: new Date().toISOString(),
        conversation_id: message.conversation_id || null,
      };
      setMessages(prev => [...prev, localMessage]);
      return { data: localMessage, error: null };
    }

    try {
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role: message.role,
          content: message.content,
          subject_id: message.subject_id || null,
          attachments: message.attachments || null,
          conversation_id: message.conversation_id || conversationId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as ChatMessage, error: null };
    } catch (error) {
      console.error('Error adding message:', error);
      return { data: null, error };
    }
  };

  return { messages, loading, addMessage, fetchMessages, setMessages };
};
