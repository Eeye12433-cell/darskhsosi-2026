import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface VirtualMeeting {
    id: string;
    user_id: string;
    title: string;
    teacher_name: string;
    meeting_link: string;
    start_time: string;
    duration: string;
    is_active: boolean;
    created_at: string;
}

export const useVirtualMeetings = () => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<VirtualMeeting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from('virtual_meetings')
                .select('*')
                .eq('is_active', true)
                .order('start_time', { ascending: true });

            if (error) throw error;
            setMeetings((data as VirtualMeeting[]) || []);
        } catch (error) {
            console.error('Error fetching meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    const createMeeting = async (meeting: {
        title: string;
        teacher_name: string;
        meeting_link: string;
        start_time: string;
        duration?: string;
    }) => {
        if (!user) return { error: new Error('Not authenticated') };

        try {
            const { data, error } = await (supabase as any)
                .from('virtual_meetings')
                .insert({
                    user_id: user.id,
                    ...meeting
                })
                .select()
                .single();

            if (error) throw error;
            setMeetings(prev => [...prev, data as VirtualMeeting]);
            return { data, error: null };
        } catch (error) {
            console.error('Error creating meeting:', error);
            return { data: null, error };
        }
    };

    const deleteMeeting = async (id: string) => {
        if (!user) return { error: new Error('Not authenticated') };

        try {
            const { error } = await (supabase as any)
                .from('virtual_meetings')
                .update({ is_active: false })
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
            setMeetings(prev => prev.filter(m => m.id !== id));
            return { error: null };
        } catch (error) {
            console.error('Error deleting meeting:', error);
            return { error };
        }
    };

    return { meetings, loading, fetchMeetings, createMeeting, deleteMeeting };
};
