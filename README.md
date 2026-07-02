# PersonaChat

PersonaChat is a Next.js 14 AI persona chat app that simulates Hitesh Choudhary and Piyush Garg with file-driven persona data, grounded resource recommendations, and streamed LLM responses.

## What It Demonstrates

- Persona switching between Hitesh Choudhary and Piyush Garg
- Streaming chat UI with markdown and code highlighting
- File-based persona storage in `personas/`
- Grounded runtime context from `data/entities`, `data/evidence`, `data/insights`, `data/examples`, and `catalogs`
- A reusable ingestion and extraction pipeline for future personas

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- OpenAI API
- react-markdown
- react-syntax-highlighter
- lucide-react

## Project Layout

- `src/app/page.tsx` - main chat page
- `src/app/api/chat/route.ts` - streamed chat API
- `src/components/` - UI components
- `src/lib/` - persona loading, grounding, and context logic
- `personas/` - base persona definitions
- `data/` - curated entities, evidence, insights, examples, and candidates
- `catalogs/` - recommended learning resources per persona
- `scripts/` - ingestion, extraction, and audit tools
- `docs/` - collection and submission notes

## Setup

1. Install dependencies.
2. Create `.env.local` from `.env.local.example`.
3. Add `OPENAI_API_KEY` to `.env.local`.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Data Flow

The app is designed around three layers:

1. Persona definition in `personas/*.json`
2. Curated grounding in `data/entities`, `data/evidence`, `data/insights`, `data/examples`
3. Runtime prompt assembly in `src/lib/persona-loader.ts`, `src/lib/persona-grounding.ts`, and `src/lib/context-manager.ts`

The optional collection pipeline lives in `scripts/` and can ingest raw transcripts, extract candidates, and support future personas without code changes.

## Submission Notes

For the assignment, the important user-facing pieces are:

- working chat interface
- persona switching
- prompt-grounded responses
- documented data collection and context strategy
- live deployment

The more advanced ingestion pipeline is there to show that the project is reusable beyond the assignment scope.

## Sample Conversations

See [`docs/sample-conversations.md`](docs/sample-conversations.md).

