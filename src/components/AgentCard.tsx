import clsx from 'clsx';
import type { Agent } from '../types/database';

interface AgentCardProps {
  agent: Agent;
  onSelect: (agent: Agent) => void;
  isActive?: boolean;
}

const typeColors: Record<Agent['type'], string> = {
  chat: 'from-blue-500/60 to-indigo-600/40',
  form: 'from-emerald-500/60 to-teal-600/40',
  workflow: 'from-purple-500/60 to-fuchsia-600/40',
  custom: 'from-amber-500/60 to-orange-600/40'
};

export function AgentCard({ agent, onSelect, isActive }: AgentCardProps) {
  return (
    <button
      onClick={() => onSelect(agent)}
      className={clsx(
        'group relative rounded-2xl border border-white/5 bg-midnight-800/70 p-5 text-left transition-transform duration-200 hover:-translate-y-1 hover:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight-900 focus-visible:ring-white/40',
        isActive && 'border-white/20 ring-2 ring-white/30'
      )}
    >
      <div
        className={clsx(
          'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br',
          typeColors[agent.type]
        )}
      />
      <div className="relative z-10 flex flex-col h-full gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl">
            {agent.icon ?? '🤖'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
            <p className="text-xs uppercase tracking-wide text-midnight-200/80">{agent.type}</p>
          </div>
        </div>
        <p className="text-sm text-midnight-100/90 line-clamp-3">{agent.description}</p>
      </div>
    </button>
  );
}
