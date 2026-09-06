# WickAI

> A focused, open-source AI workspace built with Next.js and the Vercel AI SDK.

WickAI is designed around a clean, fast chat experience with an OpenAI-compatible backend. The provider endpoint is configurable, so the same app can talk to OpenRouter or a locally hosted 9router-style gateway without changing the UI.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Vercel AI SDK
- `@ai-sdk/openai` for OpenAI-compatible endpoints
- Zod request validation
- Vercel-ready server route handlers

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

### OpenRouter

```env
WICKAI_BASE_URL=https://openrouter.ai/api/v1
WICKAI_API_KEY=your-openrouter-key
WICKAI_MODEL=your-model-id
WICKAI_MODELS=your-model-id|WickAI Pro
```

### Local 9router-style gateway

Use the URL exposed by your local gateway. For example:

```env
WICKAI_BASE_URL=http://127.0.0.1:8000/v1
WICKAI_API_KEY=your-local-key
WICKAI_MODEL=your-local-model-id
WICKAI_MODELS=your-local-model-id|WickAI Pro
```

A local endpoint on `127.0.0.1` works for local development. It will **not** be reachable from a Vercel Function unless you expose the service through a network-accessible HTTPS endpoint. For Vercel production, use OpenRouter or another publicly reachable OpenAI-compatible provider.

## Environment security

Never use `NEXT_PUBLIC_` for `WICKAI_API_KEY` or another provider secret. Next.js inlines `NEXT_PUBLIC_*` variables into browser JavaScript, so provider credentials must remain server-side.

`.env`, `.env.*`, `.vercel/`, logs, build output, and `node_modules` are ignored by Git. `.env.example` is intentionally tracked as documentation.

## API routes

- `POST /api/chat` — streams a WickAI response using the configured OpenAI-compatible provider.
- `GET /api/models` — returns the safe model catalog configured through `WICKAI_MODELS`/`WICKAI_MODEL`.
- `GET /api/health` — lightweight runtime health check.

## Deploy on Vercel

1. Import `Magnw27/wickai` into Vercel.
2. Add `WICKAI_BASE_URL`, `WICKAI_API_KEY`, `WICKAI_MODEL`, and optionally `WICKAI_MODELS` in Project Settings → Environment Variables.
3. Deploy.
4. Verify `/api/health` and then open the main app.

For previews and production, keep secrets in Vercel Environment Variables rather than committing them to Git.

## Development roadmap

### Current

- Responsive WickAI chat shell
- Mobile sidebar
- Model selector
- Streaming AI route
- Local browser chat history
- Copy/regenerate controls
- Loading/error states
- Reduced-motion support
- Provider-neutral environment configuration

### Next

- AI Elements integration for production message/markdown rendering
- Real persistent database conversations
- Authentication
- File attachments and vision
- Web search and tools
- MCP and agent workflows
- Knowledge base / RAG
- Production observability and rate limiting
