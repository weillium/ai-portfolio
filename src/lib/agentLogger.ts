import { supabase } from './supabaseClient';

interface LogAgentRunOptions {
  sessionId: string;
  agentId: string;
  userId: string;
  input: Record<string, any>;
  output: Record<string, any>;
  tokensUsed?: number;
  costEstimate?: number;
}

export async function logAgentRun({
  sessionId,
  agentId,
  userId,
  input,
  output,
  tokensUsed,
  costEstimate
}: LogAgentRunOptions) {
  await supabase.from('agent_runs').insert({
    session_id: sessionId,
    agent_id: agentId,
    user_id: userId,
    input_json: input,
    output_json: output,
    tokens_used: tokensUsed ?? null,
    cost_estimate: costEstimate ?? null
  });
}
