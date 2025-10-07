import { ReactNode, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthGateProps {
  children: (props: { userId: string; session: Session }) => ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    void init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('Sending magic link…');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus('Check your inbox for a magic sign-in link.');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight-900 text-gray-200">
        <p>Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight-900 px-6">
        <form
          onSubmit={handleSignIn}
          className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-midnight-800/80 p-8 text-gray-100 shadow-2xl shadow-black/40"
        >
          <h2 className="text-2xl font-semibold text-white">Access the AI Agents Workbench</h2>
          <p className="text-sm text-gray-400">
            Sign in with your email to manage your agent sessions.
          </p>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-2xl border border-white/10 bg-midnight-900/70 px-4 py-3 text-sm text-gray-100 outline-none focus:border-white/30"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-midnight-500 py-3 text-sm font-semibold text-white transition hover:bg-midnight-400"
          >
            Send magic link
          </button>
          {status && <p className="text-xs text-gray-400">{status}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="absolute right-6 top-6 z-50">
        <div className="rounded-full bg-midnight-800/90 px-4 py-2 text-xs text-gray-200 shadow">
          {session.user.email}
          <button
            onClick={handleSignOut}
            className="ml-3 rounded-full bg-red-500/80 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-400/80"
          >
            Sign out
          </button>
        </div>
      </div>
      {children({ userId: session.user.id, session })}
    </div>
  );
}
