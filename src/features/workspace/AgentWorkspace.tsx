import type { Agent } from '../../types/database';
import type { SessionWithAgent } from '../../hooks/useSessions';
import { ChatAgentView } from '../chat/ChatAgentView';
import { FormAgentView } from '../form/FormAgentView';
import { WorkflowAgentView } from '../workflow/WorkflowAgentView';
import { CustomAgentView } from '../custom/CustomAgentView';

interface AgentWorkspaceProps {
  agent: Agent;
  session: SessionWithAgent;
  userId: string;
  onUpdateSessionState: (state: Record<string, any>) => Promise<void>;
}

export function AgentWorkspace({ agent, session, userId, onUpdateSessionState }: AgentWorkspaceProps) {
  const sessionState = (session.session_state ?? {}) as Record<string, any>;

  switch (agent.type) {
    case 'chat':
      return (
        <ChatAgentView
          agent={agent}
          userId={userId}
          sessionId={session.id}
          sessionState={sessionState as { messages: any[] }}
          onUpdateSessionState={onUpdateSessionState}
        />
      );
    case 'form':
      return (
        <FormAgentView
          agent={agent}
          userId={userId}
          sessionId={session.id}
          sessionState={sessionState as { values: Record<string, any> }}
          onUpdateSessionState={onUpdateSessionState}
        />
      );
    case 'workflow':
      return (
        <WorkflowAgentView
          agent={agent}
          sessionState={sessionState as { nodes: any[]; edges: any[] }}
          onUpdateSessionState={onUpdateSessionState}
        />
      );
    case 'custom':
    default:
      return (
        <CustomAgentView
          agent={agent}
          userId={userId}
          sessionId={session.id}
          sessionState={sessionState}
          onUpdateSessionState={onUpdateSessionState}
        />
      );
  }
}
