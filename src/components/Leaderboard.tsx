import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../lib/types';

interface LeaderboardProps {
    teamName: string | null;
    onSignOut: () => void;
}

export default function Leaderboard({ teamName, onSignOut }: LeaderboardProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [signOutConfirm, setSignOutConfirm] = useState(false);
    const currentTeamName = teamName;

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset confirm state when panel closes
        if (!isOpen) setSignOutConfirm(false);
    }, [isOpen]);

    useEffect(() => {
        // Initial fetch
        async function fetchLeaderboard() {
            const { data } = await supabase
                .from('users')
                .select('*')
                .order('score', { ascending: false })
                .limit(50);

            if (data) setUsers(data);
        }
        fetchLeaderboard();

        // Real-time subscription
        const subscription = supabase
            .channel('leaderboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'users' },
                () => {
                    // Simplest approach: re-fetch on any change to ensure correct ordering
                    fetchLeaderboard();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    return (
        <>
            {/* Toggle Button (trophy icon) */}
            <button
                className={`fab fab-leaderboard ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Leaderboard"
            >
                <div className="trophy-icon">🏆</div>
            </button>

            {/* Leaderboard Panel */}
            <div className={`leaderboard-panel ${isOpen ? 'open' : ''}`}>
                <div className="leaderboard-header">
                    <h2>Live Standings</h2>
                    <div className="header-actions">
                        <button
                            className={`sign-out-btn ${signOutConfirm ? 'confirming' : ''}`}
                            onClick={() => {
                                if (signOutConfirm) {
                                    onSignOut();
                                } else {
                                    setSignOutConfirm(true);
                                    setTimeout(() => setSignOutConfirm(false), 3000);
                                }
                            }}
                        >
                            {signOutConfirm ? 'Confirm?' : 'Sign Out'}
                        </button>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
                    </div>
                </div>

                <div className="leaderboard-list">
                    {users.map((user, index) => {
                        const isMe = user.team_name === currentTeamName;
                        let rankEmoji = '';
                        if (index === 0) rankEmoji = '🥇';
                        if (index === 1) rankEmoji = '🥈';
                        if (index === 2) rankEmoji = '🥉';

                        return (
                            <div key={user.id} className={`leaderboard-item ${isMe ? 'is-me' : ''}`}>
                                <div className="rank">
                                    {rankEmoji || `#${index + 1}`}
                                </div>
                                <div className="team-name">
                                    {user.team_name}
                                    {isMe && <span className="you-badge">(YOU)</span>}
                                </div>
                                <div className="score">
                                    {user.score} <span className="pts">pts</span>
                                </div>
                            </div>
                        );
                    })}

                    {users.length === 0 && (
                        <div className="empty-state">No teams yet. Be the first!</div>
                    )}
                </div>
            </div>
        </>
    );
}
