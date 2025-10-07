import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
  auth: { persistSession: false }
});

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { agentId, sessionId, userId, payload } = await req.json();

  await supabase.from('agent_runs').insert({
    session_id: sessionId,
    agent_id: agentId,
    user_id: userId,
    input_json: payload,
    output_json: { status: 'received' }
  });

  return new Response(
    JSON.stringify({ status: 'ok', message: 'Plan saved', timestamp: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
