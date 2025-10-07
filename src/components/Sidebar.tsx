import { useMemo } from 'react';
import { Clock, Plus, X } from 'lucide-react';
import clsx from 'clsx';
import type { Agent, Session } from '../types/database';

interface SidebarProps {
  sessions: (Session & { agent?: Agent })[];
  activeSessionId: string | null;
  onSelectSession: (session: Session & { agent?: Agent }) => void;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  collapsed,
  onToggleCollapse
}: SidebarProps) {
  const groupedSessions = useMemo(() => {
    const groups: Record<string, (Session & { agent?: Agent })[]> = {};
    for (const session of sessions) {
      const key = session.agent?.name ?? 'Other';
      groups[key] = groups[key] ?? [];
      groups[key].push(session);
    }
    return Object.entries(groups);
  }, [sessions]);

  return (
    <aside
      className={clsx(
        'flex flex-col transition-all duration-300 bg-midnight-800/80 backdrop-blur border-r border-white/5 shadow-lg shadow-black/30',
        collapsed ? 'w-20' : 'w-72'
      )}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        <button
          onClick={onToggleCollapse}
          className="text-gray-300 hover:text-white transition-colors text-sm font-semibold"
        >
          {collapsed ? '▶' : 'Sessions'}
        </button>
        {!collapsed && (
          <button
            onClick={onCreateSession}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-midnight-600/80 rounded-full hover:bg-midnight-500 transition"
          >
            <Plus size={14} />
            New
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {groupedSessions.length === 0 && !collapsed && (
          <p className="text-xs text-gray-400 px-2">
            Start by selecting an agent from the grid.
          </p>
        )}

        {groupedSessions.map(([group, items]) => (
          <div key={group}>
            {!collapsed && <p className="text-xs uppercase tracking-wide text-gray-500 px-2 mb-2">{group}</p>}
            <div className="space-y-2">
              {items.map((session) => {
                const active = session.id === activeSessionId;
                return (
                  <button
                    key={session.id}
                    onClick={() => onSelectSession(session)}
                    className={clsx(
                      'w-full text-left px-3 py-2 rounded-xl transition-all duration-200 border border-transparent relative group',
                      active
                        ? 'bg-midnight-600/60 border-white/10 shadow-inner'
                        : 'bg-midnight-700/40 hover:bg-midnight-600/40'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-100 line-clamp-1">
                        {session.title}
                      </span>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {!collapsed && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>{new Date(session.last_active_at ?? session.created_at).toLocaleString()}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
