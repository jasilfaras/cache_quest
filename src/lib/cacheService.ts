import { supabase } from './supabase';
import type { Cache, CacheWithUser } from './types';

// ─── Read ───

export async function fetchCaches(): Promise<{ data: Cache[] | null; error: Error | null }> {
    const { data, error } = await supabase
        .from('caches')
        .select('*');
    return { data, error };
}

export async function fetchCachesWithUsers(): Promise<{ data: CacheWithUser[] | null; error: Error | null }> {
    const { data, error } = await supabase
        .from('caches')
        .select('*, users(team_name)')
        .order('created_at', { ascending: false });
    return { data: data as CacheWithUser[] | null, error };
}

// ─── Mutations ───

export async function claimCache(cacheId: string, userId: string) {
    return supabase
        .from('caches')
        .update({ is_found: true, found_by: userId })
        .eq('id', cacheId);
}

export async function createCache(payload: {
    name: string;
    lat: number;
    lng: number;
    hint: string | null;
    secret_code: string;
}) {
    return supabase.from('caches').insert({ ...payload, is_found: false });
}

export async function updateCache(
    cacheId: string,
    payload: { name: string; lat: number; lng: number; hint: string | null; secret_code: string }
) {
    return supabase.from('caches').update(payload).eq('id', cacheId);
}

export async function deleteCache(cacheId: string) {
    return supabase.from('caches').delete().eq('id', cacheId);
}

export async function resetGame() {
    // Reset all caches to unfound
    const { error: cacheError } = await supabase
        .from('caches')
        .update({ is_found: false, found_by: null })
        .not('id', 'is', null); // WHERE id IS NOT NULL → matches all rows

    if (cacheError) return { data: null, error: cacheError };

    // Reset all user scores
    const { error: userError } = await supabase
        .from('users')
        .update({ score: 0 })
        .not('id', 'is', null);

    return { data: null, error: userError };
}
