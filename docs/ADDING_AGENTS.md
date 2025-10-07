# Adding new agents

The workbench supports both config-driven agents (stored entirely in the Supabase `agents` table) and bespoke agents implemented as React components.

## 1. Config-driven agents

1. Insert a new row into the `agents` table with the appropriate `type`.
2. Supply a JSON configuration (`config_json`) for UI-specific needs.

| Type | Required config | Notes |
| ---- | ----------------| ----- |
| `chat` | Optional `system_prompt` string used by the OpenAI proxy. | Chat history is persisted automatically in `session_state.messages`. |
| `form` | `fields` array describing inputs. Each field supports `name`, `label`, `type`, `placeholder`, `options` (for selects), and `helperText`. Optional `submitFunction` string will invoke `/functions/v1/{submitFunction}`. | Values are persisted in `session_state.values`. |
| `workflow` | Optional initial `nodes` and `edges` arrays. | Placeholder builder today; replace with advanced canvas later. |
| `custom` | `component` string matching a file in `src/agents` (without extension). | Full control over UI and behaviour. |

Example SQL for a new chat agent:

```sql
insert into public.agents (name, description, type, icon, config_json)
values (
  'Meta Planner',
  'Orchestrates multiple agents on your behalf.',
  'chat',
  '🪄',
  '{"system_prompt":"You are Meta Planner. Decompose tasks and call downstream agents."}'
);
```

## 2. Custom-coded agents

1. Create a new React component under `src/agents`. The file must export a default component that accepts the `CustomAgentProps` interface.
2. Reference the component in Supabase by setting `type='custom'` and `config_json ->> 'component'` to the component name.

Example component:

```tsx
import type { CustomAgentProps } from '../types/customAgents';

export default function CRMInspector({ sessionState, onUpdateSessionState }: CustomAgentProps) {
  const leads = sessionState.leads ?? [];
  // ...render UI and call onUpdateSessionState to persist changes
}
```

```sql
insert into public.agents (name, description, type, icon, config_json)
values (
  'CRM Inspector',
  'Visualise and triage pipeline health.',
  'custom',
  '📊',
  '{"component":"CRMInspector"}'
);
```

## 3. Registering secure actions

If your agent calls external APIs, create a Supabase Edge Function under `supabase/functions/<function-name>` and deploy it via `supabase functions deploy <function-name>`. Store the function name inside `config_json.submitFunction` (for forms) or invoke it from your custom component.

Edge functions have access to secrets (e.g. OpenAI keys) and can log interactions by inserting into the `agent_runs` table.

## 4. Amplify deployment notes

When hosting on AWS Amplify, configure the following environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Also ensure Supabase Edge Functions are deployed and reachable via `https://<project>.functions.supabase.co`. Update the fetch URLs in the app if you deploy under a custom domain.
