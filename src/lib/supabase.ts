import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export const authHelpers = {
  signUp: async (email: string, password: string, fullName: string, role: 'user' | 'admin' = 'user') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    // If signup successful and role is admin, update the role
    if (data.user && !error && role === 'admin') {
      await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', data.user.id);
    }

    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async (): Promise<{ user: User | null; session: Session | null }> => {
    const { data: { session } } = await supabase.auth.getSession();
    return { user: session?.user ?? null, session };
  },

  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};

export const checkUserRole = async (userId: string, role: 'admin' | 'user'): Promise<boolean> => {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', role)
    .single();
  
  return !!data;
};

export const getUserRoles = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  return { roles: data?.map(r => r.role) || [], error };
};
