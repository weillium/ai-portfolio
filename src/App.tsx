import { useEffect, useMemo, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { AgentCard } from './components/AgentCard';
import { AgentWorkspace } from './features/workspace/AgentWorkspace';
import type { Agent } from './types/database';
import { supabase } from './lib/supabaseClient';
import { useSessions } from './hooks/useSessions';

function App() {
  return (
    <AuthGate>
      {({ userId }) => <Dashboard userId={userId} />}
    </AuthGate>
  );
}

function Dashboard({ userId }: { userId: string }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { sessions, createSession, updateSessionState, deleteSession } = useSessions(userId);

  useEffect(() => {
    const fetchAgents = async () => {
      setLoadingAgents(true);
      const { data, error } = await supabase.from('agents').select('*').order('created_at', { ascending: true });
      if (error) {
        setAgentError(error.message);
      } else {
        setAgents((data as Agent[]) ?? []);
      }
      setLoadingAgents(false);
    };
    void fetchAgents();
  }, []);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );

  const activeAgent = useMemo(() => {
    if (!activeSession) return null;
    return activeSession.agent ?? agents.find((agent) => agent.id === activeSession.agent_id) ?? null;
  }, [agents, activeSession]);

  const handleSelectAgent = async (agent: Agent) => {
    const existingSession = sessions.find((session) => session.agent_id === agent.id);
    if (existingSession) {
      setActiveSessionId(existingSession.id);
      return;
    }
    const session = await createSession(agent);
    if (session) {
      setActiveSessionId(session.id);
    }
  };

  const handleCreateSession = async () => {
    if (agents.length === 0) return;
    const primaryAgent = agents[0];
    const session = await createSession(primaryAgent);
    if (session) {
      setActiveSessionId(session.id);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  };

  return (
    <Layout
      sidebar={
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(session) => setActiveSessionId(session.id)}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        />
      }
    >
      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Available agents</h2>
            {loadingAgents && <span className="text-xs text-gray-400">Loading agents…</span>}
          </div>
          {agentError && <p className="mt-2 text-sm text-red-400">{agentError}</p>}
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onSelect={handleSelectAgent}
                isActive={activeAgent?.id === agent.id}
              />
            ))}
          </div>
          {agents.length === 0 && !loadingAgents && (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-midnight-800/60 p-6 text-sm text-gray-400">
              No agents configured yet. Insert records into the <span className="font-semibold">agents</span> table to make
              them appear here.
            </div>
          )}
        </section>

        <section className="min-h-[420px]">
          {activeSession && activeAgent ? (
            <AgentWorkspace
              agent={activeAgent}
              session={activeSession}
              userId={userId}
              onUpdateSessionState={(state) => updateSessionState(activeSession.id, state)}
            />
          ) : (
            <div className="flex h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-midnight-800/40 text-center">
              <p className="text-lg font-semibold text-gray-200">Select an agent to get started</p>
              <p className="mt-2 max-w-lg text-sm text-gray-400">
                Choose one of the agents above to create a new session or resume your previous work. Session history and
                context is automatically persisted to Supabase so you can return anytime.
              </p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default App;
