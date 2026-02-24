import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { LivePlayer } from '../lib/types';

/**
 * Subscribe to the player-tracking Presence channel as a **read-only observer**.
 *
 * Uses a distinct channel name from the player's own tracking channel to avoid
 * Supabase channel collisions (GameScreen uses 'player-tracking', this uses
 * 'admin-player-tracking').
 */
export function useLivePlayers(): LivePlayer[] {
    const [players, setPlayers] = useState<LivePlayer[]>([]);

    useEffect(() => {
        const channel = supabase.channel('player-tracking');

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const result: LivePlayer[] = [];
                for (const key in state) {
                    const presences = state[key] as unknown[];
                    if (presences && presences.length > 0) {
                        result.push(presences[0] as LivePlayer);
                    }
                }
                setPlayers(result);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return players;
}
