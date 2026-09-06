# WickAI

Modern, provider-agnostic AI chat workspace built with Next.js, React, Tailwind CSS, and the Vercel AI SDK.

WickAI talks to any OpenAI-compatible endpoint. Use OpenRouter in production or point the same app at your local 9router-compatible server during development.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Vercel AI SDK 7
- Lucide React
- OpenAI-compatible provider adapter
- Vercel-ready deployment

## Environment

Copy `.env.example` to `.env.local` and set your values:

```env
WICKAI_BASE_URL=https://openrouter.ai/api/v1
WICKAI_API_KEY=your-secret-key
WICKAI_MODEL=openai/gpt-5.5
```

For a local 9router-compatible server, point `WICKAI_BASE_URL` at its OpenAI-compatible `/v1` endpoint, for example:

```env
WICKAI_BASE_URL=http://127.0.0.1:8000/v1
WICKAI_API_KEY=local-key
WICKAI_MODEL=your-local-model
```

Never commit `.env.local` or real API keys.

## Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Vercel

Import `Magnw27/wickai` into Vercel. No custom server is required. Add `WICKAI_BASE_URL`, `WICKAI_API_KEY`, and `WICKAI_MODEL` in the Vercel project environment variables, then deploy.

## Architecture

The browser talks only to `/api/chat`. The route handler owns the AI provider configuration, so API credentials stay server-side. The provider URL is configuration-driven, making OpenRouter and local OpenAI-compatible gateways interchangeable.

## Design direction

WickAI takes UX inspiration from LobeChat, feature inspiration from Open WebUI, and implementation patterns from Vercel's AI Chatbot / AI SDK while keeping its own visual identity and architecture.
