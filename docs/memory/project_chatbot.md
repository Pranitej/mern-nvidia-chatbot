---
name: Chatbot Project Overview
description: Full context of the production-grade MERN chatbot being built — stack, AI provider, key decisions, spec and plan locations
type: project
---

Building a production-grade MERN chatbot application from scratch.

**Why:** Learning/study project at d:\Study\MERN\Chatbot, intended for later cloud deployment.

**Stack:** React 19 + Vite 8 + Tailwind v4 (client) · Node.js/Express + MongoDB/Mongoose (server) · Zustand v5 · TanStack Query v5 · React Router v7

**AI Provider:** NVIDIA NIM — DeepSeek V3.2 685B
- Model ID: `deepseek-ai/deepseek-v3.2`
- Base URL: `https://integrate.api.nvidia.com/v1`
- OpenAI-compatible SDK (`openai` npm package)
- Streaming via SSE with dual output: `content` + `reasoning_content`
- Params: temperature=1, top_p=0.95, max_tokens=8192, chat_template_kwargs={thinking:true}
- API key from: https://build.nvidia.com

**Key Decisions:**
- JWT in httpOnly cookies (access 15min, refresh 7d with rotation)
- Reasoning shown as collapsible "Thinking..." block — Claude-style
- SSE (not WebSocket) for streaming
- Tailwind v4 with `@tailwindcss/vite` plugin (no tailwind.config.js)
- Central config in server/config/config.js and client/src/config/config.js — single source of truth for models, AI params, rate limits, etc.
- `server/app.js` exports Express app (for testing); `server/server.js` calls listen
- Vitest for both server tests (+ Supertest + mongodb-memory-server) and client

**Spec:** `docs/superpowers/specs/2026-03-31-chatbot-design.md`
**Plan:** `docs/superpowers/plans/2026-03-31-chatbot-implementation.md` (22 tasks)

**How to apply:** Always refer to spec/plan before suggesting changes. Config changes go in config.js files only.
