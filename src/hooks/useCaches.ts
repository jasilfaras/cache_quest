import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fetchCaches, fetchCachesWithUsers } from '../lib/cacheService';
import type { Cache } from '../lib/types';

interface UseCachesOptions {
    /** If true, joins users table to get team_name on found caches */
    withUsers?: boolean;
    /** Channel name for realtime subscription (must be unique per consumer) */
    channelName?: string;
    /** Whether to activate the hook (e.g. skip loading when user is not logged in) */
    enabled?: boolean;
}

interface UseCachesResult<T extends Cache> {
    caches: T[];
    loading: boolean;
    refresh: () => Promise<void>;
}

/**
 * Shared hook for loading caches with realtime Postgres Changes subscription.
 *
 * Used by both GameScreen (basic Cache[]) and AdminDashboard (CacheWithUser[]).
 * Each consumer MUST pass a unique `channelName` to avoid Supabase channel collisions.
 */
export function useCaches<T extends Cache = Cache>(
    options: UseCachesOptions = {}
): UseCachesResult<T> {
    const {
        withUsers = false,
        channelName = 'caches-realtime',
        enabled = true,
    } = options;

    const [caches, setCaches] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCaches = useCallback(async () => {
        if (withUsers) {
            const { data } = await fetchCachesWithUsers();
            if (data) setCaches(data as unknown as T[]);
        } else {
            const { data } = await fetchCaches();
            if (data) setCaches(data as unknown as T[]);
        }
        setLoading(false);
    }, [withUsers]);

    useEffect(() => {
        if (!enabled) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: initial fetch on mount
        loadCaches();

        const subscription = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'caches' },
                () => {
                    // Re-fetch on any change to keep ordering consistent
                    loadCaches();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [enabled, channelName, loadCaches]);

    return { caches, loading, refresh: loadCaches };
}
