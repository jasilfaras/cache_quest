import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.VITE_SUPABASE_URL;
if (supabaseUrl === '/') supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const channel = supabase.channel('mission-control-tracking', {
    config: { presence: { key: 'mock-player-1' } }
});

channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
        console.log('Subscribed to presence! Broadcasting...');

        let lat = 10.26958776890891;
        let lng = 76.40033169372305;

        setInterval(async () => {
            // Move slightly northeast
            lat += 0.0001;
            lng += 0.0001;

            await channel.track({
                userId: 'mock-player-1',
                teamName: 'Team Rocket',
                latitude: lat,
                longitude: lng,
                lastTick: Date.now()
            });
            console.log('Broadcasted:', { lat, lng });
        }, 2000);
    }
});
