import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.3';
import OpenAI from 'https://esm.sh/openai@4.59.1';

const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!openAiApiKey || !supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables for OpenAI proxy function.');
}

const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
  auth: {
    persistSession: false
  }
});

const openai = new OpenAI({ apiKey: openAiApiKey });

type ChatCompletionMessageParam = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { agentId, sessionId, userId, messages, systemPrompt } = await req.json();

    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        ...messages.map((message: ChatCompletionMessageParam) => ({ role: message.role, content: message.content }))
      ]
    });

    const textOutput = completion.output?.[0]?.content?.[0]?.text ?? '';
    const tokens = completion.usage?.total_tokens ?? 0;
    const costEstimate = tokens * 0.000002;

    await supabase.from('agent_runs').insert({
      session_id: sessionId,
      agent_id: agentId,
      user_id: userId,
      input_json: { messages },
      output_json: { message: textOutput },
      tokens_used: tokens,
      cost_estimate: costEstimate
    });

    return new Response(
      JSON.stringify({
        message: { role: 'assistant', content: textOutput },
        usage: completion.usage,
        costEstimate
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Edge function error', error);
    return new Response(JSON.stringify({ error: error.message ?? 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
