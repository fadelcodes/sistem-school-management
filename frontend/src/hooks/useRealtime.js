import { useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useRealtime = (table, callback, filter = null) => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        let subscription;

        const setupSubscription = async () => {
            let channel = supabase
                .channel(`${table}-changes`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: table,
                        filter: filter
                    },
                    (payload) => {
                        callback(payload);
                        
                        // Show toast based on event type
                        if (payload.eventType === 'INSERT') {
                            toast.success(`Data ${table} baru ditambahkan`);
                        } else if (payload.eventType === 'UPDATE') {
                            toast.success(`Data ${table} diperbarui`);
                        }
                    }
                )
                .subscribe();

            subscription = channel;
        };

        setupSubscription();

        return () => {
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, [user, table, filter]);
};

export const useRealtimeNotifications = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const subscription = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    // Trigger refresh or update state
                    window.dispatchEvent(new CustomEvent('new-notification', { 
                        detail: payload.new 
                    }));
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);
};