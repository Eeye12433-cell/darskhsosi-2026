import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Conversation {
  id: string;
  user_id: string;
  feature_id: string;
  subject: string;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useConversations = (featureId: string, subject: string = 'general') => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await (supabase as any)
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('feature_id', featureId)
        .eq('subject', subject)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const convs = (data || []) as Conversation[];
      setConversations(convs);
      
      // Set active conversation (most recent active one, or most recent)
      const active = convs.find(c => c.is_active) || convs[0] || null;
      if (active && !activeConversation) {
        setActiveConversation(active);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user, featureId, subject]);

  useEffect(() => {
    setActiveConversation(null);
    setLoading(true);
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = useCallback(async (title?: string) => {
    if (!user) return null;
    try {
      // Deactivate all others for this feature
      await (supabase as any)
        .from('conversations')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('feature_id', featureId)
        .eq('subject', subject);

      const { data, error } = await (supabase as any)
        .from('conversations')
        .insert({
          user_id: user.id,
          feature_id: featureId,
          subject,
          title: title || (featureId === 'teacher' ? 'محادثة جديدة' : `محادثة جديدة`),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      const conv = data as Conversation;
      setConversations(prev => [conv, ...prev]);
      setActiveConversation(conv);
      return conv;
    } catch (err) {
      console.error('Error creating conversation:', err);
      return null;
    }
  }, [user, featureId, subject]);

  const switchConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    try {
      await (supabase as any)
        .from('conversations')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('feature_id', featureId)
        .eq('subject', subject);

      await (supabase as any)
        .from('conversations')
        .update({ is_active: true })
        .eq('id', conversationId);

      const conv = conversations.find(c => c.id === conversationId);
      if (conv) setActiveConversation({ ...conv, is_active: true });
    } catch (err) {
      console.error('Error switching conversation:', err);
    }
  }, [user, featureId, subject, conversations]);

  const updateTitle = useCallback(async (conversationId: string, title: string) => {
    try {
      await (supabase as any)
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);
      
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title } : c));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => prev ? { ...prev, title } : prev);
      }
    } catch (err) {
      console.error('Error updating title:', err);
    }
  }, [activeConversation]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    try {
      await (supabase as any)
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      setConversations(prev => {
        const remaining = prev.filter(c => c.id !== conversationId);
        if (activeConversation?.id === conversationId) {
          setActiveConversation(remaining[0] || null);
        }
        return remaining;
      });
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  }, [user, activeConversation]);

  return {
    conversations,
    activeConversation,
    loading,
    createConversation,
    switchConversation,
    updateTitle,
    deleteConversation,
    setActiveConversation,
  };
};
