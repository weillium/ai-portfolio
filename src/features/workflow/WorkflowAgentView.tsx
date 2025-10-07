import { useMemo } from 'react';
import type { Agent } from '../../types/database';

interface WorkflowAgentViewProps {
  agent: Agent;
  sessionState: { nodes: any[]; edges: any[] };
  onUpdateSessionState: (state: Record<string, any>) => Promise<any>;
}

export function WorkflowAgentView({ agent, sessionState, onUpdateSessionState }: WorkflowAgentViewProps) {
  const nodes = useMemo(() => sessionState?.nodes ?? [], [sessionState]);

  const addNode = async () => {
    const newNode = {
      id: crypto.randomUUID(),
      label: `Step ${nodes.length + 1}`,
      description: 'Describe this step…',
      created_at: new Date().toISOString()
    };
    const updatedNodes = [...nodes, newNode];
    await onUpdateSessionState({ nodes: updatedNodes, edges: sessionState?.edges ?? [] });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-white/10 bg-midnight-800/60 p-6 shadow-xl shadow-black/30">
        <h3 className="text-lg font-semibold text-white">{agent.name} workflow builder</h3>
        <p className="mt-2 text-sm text-gray-400">
          Drag-and-drop builder placeholder. Add nodes to capture workflow steps. Future integrations can plug in
          advanced workflow engines.
        </p>
        <button
          onClick={addNode}
          className="mt-4 rounded-full bg-midnight-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-midnight-400"
        >
          Add workflow step
        </button>
      </div>
      <div className="grid gap-4">
        {nodes.map((node) => (
          <div key={node.id} className="rounded-xl border border-white/5 bg-midnight-900/60 p-4">
            <h4 className="text-sm font-semibold text-gray-100">{node.label}</h4>
            <p className="text-xs text-gray-400">{node.description}</p>
          </div>
        ))}
        {nodes.length === 0 && (
          <p className="text-sm text-gray-500">No workflow steps yet. Use the button above to add the first step.</p>
        )}
      </div>
    </div>
  );
}
