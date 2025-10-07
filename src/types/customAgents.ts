import type { Agent } from './database';

export interface CustomAgentProps {
  agent: Agent;
  sessionId: string;
  userId: string;
  sessionState: Record<string, any>;
  onUpdateSessionState: (state: Record<string, any>) => Promise<any>;
}
