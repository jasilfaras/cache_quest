import type { Database } from './database.types';

export type Cache = Database['public']['Tables']['caches']['Row'];
export type User = Database['public']['Tables']['users']['Row'];

export type CacheWithUser = Cache & {
    users?: { team_name: string } | null;
};

export interface LivePlayer {
    userId: string;
    teamName: string;
    latitude: number;
    longitude: number;
    lastTick: number;
}
