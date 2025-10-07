import { FormEvent, useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import type { Agent } from '../../types/database';
import type { ChatMessage } from '../../types/chat';
import { logAgentRun } from '../../lib/agentLogger';
import { supabase } from '../../lib/supabaseClient';

interface ChatAgentViewProps {
  agent: Agent;
  userId: string;
  sessionId: string;
  sessionState: { messages: ChatMessage[] };
  onUpdateSessionState: (state: Record<string, any>) => Promise<any>;
}

export function ChatAgentView({
  agent,
  userId,
  sessionId,
  sessionState,
  onUpdateSessionState
}: ChatAgentViewProps) {
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messages = useMemo(() => sessionState?.messages ?? [], [sessionState]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString()
    };

    const updatedMessages = [...messages, newMessage];
    setPending(true);
    setError(null);
    setInput('');
    await onUpdateSessionState({ messages: updatedMessages });

    try {
      const { data, error } = await supabase.functions.invoke('openai-proxy', {
        body: {
          agentId: agent.id,
          sessionId,
          userId,
          messages: updatedMessages,
          systemPrompt: agent.config_json?.system_prompt
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const payload = data as any;
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: payload.message?.content ?? 'The agent did not return a response.',
        created_at: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      await onUpdateSessionState({ messages: finalMessages });

      await logAgentRun({
        sessionId,
        agentId: agent.id,
        userId,
        input: { messages: updatedMessages, systemPrompt: agent.config_json?.system_prompt },
        output: { messages: [assistantMessage] },
        tokensUsed: payload.usage?.total_tokens,
        costEstimate: payload.costEstimate
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/5 bg-midnight-800/60 shadow-xl shadow-black/30">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-midnight-900/60 p-6 text-center text-sm text-gray-400">
            Start the conversation with {agent.name}.
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex flex-col gap-1"
          >
            <span className="text-xs uppercase tracking-wide text-gray-500">
              {message.role === 'assistant' ? agent.name : 'You'}
            </span>
            <div
              className={
                message.role === 'assistant'
                  ? 'self-start max-w-xl rounded-2xl bg-white/5 px-4 py-3 text-sm text-gray-100 shadow'
                  : 'self-end max-w-xl rounded-2xl bg-midnight-600/70 px-4 py-3 text-sm text-white shadow'
              }
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`Message ${agent.name}`}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-white/10 bg-midnight-900/70 px-4 py-3 text-sm text-gray-100 outline-none focus:border-white/30"
          />
          <button
            type="submit"
            disabled={pending}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-midnight-500 hover:bg-midnight-400 transition text-white disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </form>
    </div>
  );
}
