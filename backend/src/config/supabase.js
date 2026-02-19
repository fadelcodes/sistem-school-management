const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
    process.exit(1);
}

// Client untuk operasi biasa
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    },
    db: {
        schema: 'public'
    }
});

// Client untuk operasi admin (jika ada service role key)
const supabaseAdmin = supabaseServiceRoleKey 
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        db: {
            schema: 'public'
        }
    })
    : supabase;

// Test connection
(async () => {
    try {
        const { error } = await supabase
            .from('roles')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ Supabase connection test failed:', error.message);
        } else {
            console.log('✅ Supabase connected successfully');
        }
    } catch (err) {
        console.error('❌ Supabase connection error:', err.message);
    }
})();

module.exports = { supabase, supabaseAdmin };