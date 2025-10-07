import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Agent, Session } from '../types/database';

type SessionWithAgent = Session & { agent?: Agent };

export function useSessions(userId: string | undefined) {
  const [sessions, setSessions] = useState<SessionWithAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('sessions')
      .select('*, agent:agents(*)')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });

    if (error) {
      setError(error.message);
      setSessions([]);
    } else {
      setSessions((data as SessionWithAgent[]) ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = useCallback(
    async (agent: Agent) => {
      if (!userId) return null;
      const initialState = getDefaultSessionState(agent.type, agent.config_json ?? {});
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          agent_id: agent.id,
          title: `${agent.name} session`,
          session_state: initialState,
          last_active_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error || !data) {
        setError(error?.message ?? 'Unable to create session');
        return null;
      }

      const session: SessionWithAgent = { ...data, agent };
      setSessions((prev) => [session, ...prev]);
      return session;
    },
    [userId]
  );

  const updateSessionState = useCallback(
    async (sessionId: string, state: Record<string, any>) => {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          session_state: state,
          last_active_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select('*')
        .single();

      if (error) {
        setError(error.message);
        return null;
      }

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? { ...session, ...data, session_state: state } : session
        )
      );
      return data as SessionWithAgent;
    },
    []
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
      if (error) {
        setError(error.message);
        return false;
      }
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      return true;
    },
    []
  );

  const sessionMap = useMemo(() =>
    sessions.reduce<Record<string, SessionWithAgent>>((acc, session) => {
      acc[session.id] = session;
      return acc;
    }, {}), [sessions]
  );

  return {
    sessions,
    sessionMap,
    loading,
    error,
    fetchSessions,
    createSession,
    updateSessionState,
    deleteSession
  };
}

function getDefaultSessionState(type: Agent['type'], config: Record<string, any>) {
  switch (type) {
    case 'chat':
      return { messages: [] };
    case 'form':
      return { values: Object.fromEntries((config?.fields ?? []).map((field: any) => [field.name, field.defaultValue ?? ''])) };
    case 'workflow':
      return { nodes: [], edges: [] };
    case 'custom':
    default:
      return {};
  }
}

export type { SessionWithAgent };
