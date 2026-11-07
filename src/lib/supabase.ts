import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client initialization with environment variable and direct fallback
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://vwtlhgqmndrshjcekhii.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_It2EcGB26YzpEj6vbZQ5-g_GorZe1C5';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    })
  : null;

// Sign in with Google via Supabase OAuth
export async function signInWithGoogleOAuth(): Promise<{ error: Error | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      error: new Error('SUPABASE_NOT_CONFIGURED')
    };
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  } catch (err: any) {
    return { error: new Error(err.message || 'Google 로그인 중 오류가 발생했습니다.') };
  }
}

// Sign out
export async function signOutUser(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  }
}
