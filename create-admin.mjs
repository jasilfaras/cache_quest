import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
    const { data, error } = await supabase.auth.signUp({
        email: 'admin@cashquest.com',
        password: 'adminpassword123',
    });

    if (error) {
        console.error('Error creating admin:', error);
    } else {
        console.log('Admin created successfully:', data.user?.email);
    }
}

createAdmin();
