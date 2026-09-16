import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  birth_date: string | null;
  education_level: 'elementary' | 'middle' | 'high' | 'university' | 'professional' | null;
  learning_style: 'visual' | 'practical' | 'illustrative' | null;
  learning_styles: string[] | null;
  learning_languages: string[] | null;
  interests: string[] | null;
  bio: string | null;
  hobbies: string | null;
  goals: string | null;
  strengths: string | null;
  weaknesses: string | null;
  study_target: string | null;
  preferred_language: 'ar' | 'en' | 'both';
  avatar_url: string | null;
  subject: string | null;
  knowledge_ratio: number | null;
  speaking_style: 'formal_ar' | 'colloquial_ar' | 'en' | 'mixed' | null;
  ai_persona: 'teacher' | 'scientist' | 'examiner' | 'analyzer' | null;
  created_at: string;
  updated_at: string;
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<{ data?: Profile | null; error?: Error | null }>;
  fetchProfile: () => Promise<void>;
  isProfileComplete: boolean;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // Handle JWT expired error
        if (error.code === 'PGRST303' || error.message?.includes('JWT expired')) {
          console.log('JWT expired, attempting refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError || !refreshData.session) {
            console.error('Could not refresh session, signing out');
            await supabase.auth.signOut();
            return;
          }

          // Retry fetch after refresh
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (retryError) throw retryError;
          if (retryData) {
            setProfile(retryData as Profile);
            return;
          }
        } else {
          throw error;
        }
      }

      if (data) {
        setProfile(data as Profile);
      } else {
        // Create profile if it doesn't exist (fallback for trigger failure)
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Learner',
            preferred_language: 'ar'
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          setProfile(newProfile as Profile);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user, fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      const profileData = data as Profile;
      setProfile(profileData);
      return { data: profileData, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error: error as Error };
    }
  }, [user]);

  const isProfileComplete = profile &&
    profile.education_level &&
    profile.learning_style;

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile, fetchProfile, isProfileComplete: !!isProfileComplete }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
