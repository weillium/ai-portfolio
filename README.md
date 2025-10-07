# AI Agents Workbench

A modern React + Tailwind web application for launching, resuming, and orchestrating multiple AI agent mini-apps. Sessions persist in Supabase so users can pick up where they left off, while custom React mini-apps can be embedded alongside config-driven agents.

## Tech stack

- **Frontend:** React (Vite) with TailwindCSS, fully client-rendered and deployable to AWS Amplify.
- **Auth & Database:** Supabase (Postgres, Row Level Security, Auth, Storage ready).
- **Edge Functions:** Supabase Functions for secure access to OpenAI and other third-party APIs.
- **Styling:** Dark, minimalist UI with Tailwind, lucide-react icons, smooth animations.

## Getting started

### 1. Install dependencies

```bash
npm install
```

> If you are in a restricted environment, install dependencies where you have network access and copy the generated `node_modules` or lockfile back into this project.

### 2. Configure environment

Create a `.env` file with your Supabase project credentials (Amplify environment variables should mirror these names):

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run the app

```bash
npm run dev
```

The dev server listens on `http://localhost:5173` by default.

## Database bootstrap

Apply the schema and sample seed data located in [`supabase/schema.sql`](supabase/schema.sql) using the Supabase SQL editor or `supabase db push`. The seed inserts three example agents (chat, form, custom) and demonstrates session persistence.

## Supabase Edge Functions

Two example edge functions live under `supabase/functions`:

- `openai-proxy` — calls the OpenAI Responses API with secure credentials and logs usage to `agent_runs`.
- `gtm-form-handler` — receives structured form submissions and records the payload.

Deploy them with the Supabase CLI:

```bash
supabase functions deploy openai-proxy
supabase functions deploy gtm-form-handler
```

Ensure the following environment variables are set for each function:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Adding agents

Consult [`docs/ADDING_AGENTS.md`](docs/ADDING_AGENTS.md) for detailed instructions on inserting config-driven agents or shipping custom React mini-apps under `src/agents`.

## Project structure

```
src/
├── agents/                # Custom-coded agent mini-apps
├── components/            # Layout, sidebar, auth gate
├── features/              # Feature-specific UIs (chat, form, workflow, workspace)
├── hooks/                 # Supabase-powered session hooks
├── lib/                   # Supabase client + logging utilities
├── types/                 # Shared TypeScript types
└── App.tsx                # Dashboard composition
supabase/
├── schema.sql             # Database schema + seeds
└── functions/             # Supabase Edge Functions
```

## Deployment (AWS Amplify)

1. Connect this repository to Amplify.
2. Set the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Amplify.
3. Add a build step that runs `npm ci` (or `npm install`) followed by `npm run build`.
4. Ensure Supabase Edge Functions are deployed and accessible from the Amplify-hosted domain (update fetch URLs if you use a custom domain).

## Future enhancements

- Plug in a “meta-agent” that can orchestrate downstream agent calls via the edge functions.
- Replace the placeholder workflow builder with a drag-and-drop canvas (e.g. React Flow).
- Instrument analytics dashboards using the persisted `agent_runs` data.
