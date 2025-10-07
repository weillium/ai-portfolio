export type AgentType = 'chat' | 'form' | 'workflow' | 'custom';

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  icon: string | null;
  config_json: Record<string, any> | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  agent_id: string;
  title: string;
  session_state: Record<string, any> | null;
  created_at: string;
  last_active_at: string;
}

export interface AgentRun {
  id: string;
  session_id: string;
  agent_id: string;
  user_id: string;
  input_json: Record<string, any> | null;
  output_json: Record<string, any> | null;
  tokens_used: number | null;
  cost_estimate: number | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}
