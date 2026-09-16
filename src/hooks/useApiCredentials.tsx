import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ApiCredentials {
  openai_api_key: string | null;
  gemini_api_key: string | null;
  custom_api_key: string | null;
  custom_base_url: string | null;
  custom_model: string | null;
}

const EMPTY: ApiCredentials = {
  openai_api_key: null,
  gemini_api_key: null,
  custom_api_key: null,
  custom_base_url: null,
  custom_model: null,
};

export const useApiCredentials = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<ApiCredentials>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchCredentials = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_api_credentials')
        .select('openai_api_key, gemini_api_key, custom_api_key, custom_base_url, custom_model')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setCredentials(data ? (data as ApiCredentials) : EMPTY);
    } catch (error) {
      console.error('Error fetching api credentials:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCredentials();
    } else {
      setCredentials(EMPTY);
      setLoading(false);
    }
  }, [user, fetchCredentials]);

  const updateCredentials = useCallback(async (updates: Partial<ApiCredentials>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    try {
      const { data, error } = await supabase
        .from('user_api_credentials')
        .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })
        .select('openai_api_key, gemini_api_key, custom_api_key, custom_base_url, custom_model')
        .single();

      if (error) throw error;
      setCredentials(data as ApiCredentials);
      return { data: data as ApiCredentials, error: null };
    } catch (error) {
      console.error('Error updating api credentials:', error);
      return { data: null, error: error as Error };
    }
  }, [user]);

  return { credentials, loading, updateCredentials, fetchCredentials };
};
