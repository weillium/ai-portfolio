import { Suspense, lazy, useMemo } from 'react';
import type { Agent } from '../../types/database';
import type { CustomAgentProps } from '../../types/customAgents';

const customComponents = import.meta.glob('../../agents/*.tsx');

interface CustomAgentViewProps {
  agent: Agent;
  userId: string;
  sessionId: string;
  sessionState: Record<string, any>;
  onUpdateSessionState: (state: Record<string, any>) => Promise<any>;
}

export function CustomAgentView({
  agent,
  userId,
  sessionId,
  sessionState,
  onUpdateSessionState
}: CustomAgentViewProps) {
  const componentKey = useMemo(() => {
    const componentName = agent.config_json?.component ?? 'WeatherVisualizer';
    return `../../agents/${componentName}.tsx`;
  }, [agent.config_json]);

  const Component = useMemo(() => {
    const importer = customComponents[componentKey];
    if (!importer) {
      return null;
    }
    return lazy(importer as () => Promise<{ default: React.ComponentType<CustomAgentProps> }>);
  }, [componentKey]);

  if (!Component) {
    return (
      <div className="rounded-2xl border border-dashed border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200">
        Custom component <span className="font-mono">{componentKey}</span> not found. Add the file under <span className="font-semibold">src/agents</span>.
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-white/5 bg-midnight-800/60 p-6 text-sm text-gray-300">
          Loading custom agent…
        </div>
      }
    >
      <Component
        agent={agent}
        userId={userId}
        sessionId={sessionId}
        sessionState={sessionState}
        onUpdateSessionState={onUpdateSessionState}
      />
    </Suspense>
  );
}
