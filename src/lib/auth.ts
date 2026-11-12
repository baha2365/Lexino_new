import { useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Role } from './types';

export interface AuthState {
  loading: boolean;
  session: Session | null;
  role: Role | null;
  name: string | null;
}

let state: AuthState = { loading: !!supabase, session: null, role: null, name: null };
const subs = new Set<() => void>();
const set = (patch: Partial<AuthState>) => {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
};

async function loadProfile(session: Session | null) {
  if (!supabase || !session) return set({ loading: false, session: null, role: null, name: null });
  const { data } = await supabase.from('profiles').select('role, display_name').eq('id', session.user.id).maybeSingle();
  const meta = session.user.user_metadata as { role?: Role; display_name?: string };
  set({
    loading: false,
    session,
    role: (data?.role as Role | undefined) ?? meta.role ?? 'parent',
    name: data?.display_name ?? meta.display_name ?? session.user.email ?? null,
  });
}

if (supabase) {
  void supabase.auth.getSession().then(({ data }) => loadProfile(data.session));
  supabase.auth.onAuthStateChange((_e, session) => {
    void loadProfile(session);
  });
}

export const getAuth = (): AuthState => state;
export const isCloud = (): boolean => !!supabase && !!state.session;

export function useAuth(): AuthState {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
  );
}

export async function signUp(email: string, password: string, role: Role, displayName: string): Promise<string | null> {
  if (!supabase) return 'Cloud is not configured.';
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, display_name: displayName },
      emailRedirectTo: `${window.location.origin}${window.location.pathname}#/welcome`,
    },
  });
  return error ? error.message : null;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Cloud is not configured.';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}
