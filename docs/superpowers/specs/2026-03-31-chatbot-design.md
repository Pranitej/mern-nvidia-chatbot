# Production-Grade MERN Chatbot — Design Spec

**Date:** 2026-03-31
**Stack:** MongoDB · Express · React 19 · Node.js · Vite · Tailwind CSS
**AI Provider:** NVIDIA NIM (DeepSeek V3 via OpenAI-compatible API)

---

## 1. Overview

A production-grade chatbot web application with full user authentication, multiple persistent conversations, real-time streaming AI responses, and a responsive ChatGPT/Claude-style UI. Built on a MERN stack with deployment-ready security and configuration patterns.

---

## 2. Architecture

**Approach:** Monorepo · REST API + SSE streaming · JWT via httpOnly cookies

```
Chatbot/
├── client/                  # React 19 + Vite + Tailwind CSS
│   └── src/
│       ├── api/             # Axios instance + typed API calls
│       ├── components/      # Reusable UI components
│       ├── config/          # client-side central config
│       ├── hooks/           # useSSE, useAuth, useConversations
│       ├── pages/           # Login, Register, Chat
│       ├── store/           # Zustand — auth state, active conversation, theme
│       └── utils/           # token helpers, sanitization, markdown
│
└── server/
    ├── config/              # DB connection, env validation, central config
    ├── controllers/         # auth, conversation, message, ai
    ├── middleware/           # authGuard, rateLimiter, errorHandler, securityHeaders
    ├── models/              # User, Conversation, Message (Mongoose)
    ├── routes/              # /api/auth, /api/conversations, /api/ai
    ├── services/            # nvidiaService.js (DeepSeek streaming client)
    └── server.js
```

**Data flow:**
1. User authenticates → JWT access token + refresh token issued as `httpOnly` cookies
2. Client fetches conversation list and message history via REST
3. User sends message → client POSTs to `/api/ai/stream/:conversationId`
4. Server saves user message, opens SSE connection, streams DeepSeek tokens to client
5. On stream completion, server persists full assistant message to MongoDB
6. Client renders streamed tokens word-by-word with a blinking cursor

---

## 3. Central Configuration

### Server — `server/config/config.js`

Single source of truth for all server-side tuneable values:

```js
export const config = {
  models: {
    default: "deepseek-ai/deepseek-v3.2",
    available: [
      { id: "deepseek-ai/deepseek-v3.2", label: "DeepSeek V3.2 685B", provider: "nvidia" },
      // Add new models here — they automatically appear in the UI selector
      // Find exact model IDs at: https://build.nvidia.com/explore/discover
    ],
  },
  ai: {
    maxTokens: 8192,
    temperature: 1,
    topP: 0.95,
    thinking: true,          // enables reasoning_content in stream deltas
    baseURL: "https://integrate.api.nvidia.com/v1",
    streamTimeout: 60_000,
  },
  auth: {
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
    bcryptRounds: 12,
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000,
  },
  rateLimit: {
    auth:   { windowMs: 60_000, max: 10 },
    api:    { windowMs: 60_000, max: 60 },
    stream: { windowMs: 60_000, max: 20 },
  },
  pagination: {
    conversationsPerPage: 20,
    messagesPerPage: 50,
  },
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:5173"],
  },
};
```

### Client — `client/src/config/config.js`

```js
export const config = {
  api: {
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
    timeout: 30_000,
  },
  chat: {
    maxMessageLength: 4000,
    streamThrottleMs: 30,
  },
  ui: {
    defaultTheme: "dark",
    sidebarWidth: 260,
  },
};
```

---

## 4. Security

### Authentication
- JWT **access token** (15min) + **refresh token** (7 days) — both in `httpOnly`, `Secure`, `SameSite=Strict` cookies
- Refresh token stored **hashed** in MongoDB; rotation on every refresh (old token invalidated)
- Passwords hashed with `bcrypt` at 12 salt rounds
- Logout clears both cookies and deletes refresh token from DB (forced revocation)

### API Hardening
| Layer | Tool | Purpose |
|---|---|---|
| Security headers | `helmet.js` | CSP, HSTS, X-Frame-Options, etc. |
| Rate limiting | `express-rate-limit` | Per-IP limits per endpoint group |
| CORS | `cors` | Whitelist from `config.cors.origins` |
| NoSQL injection | `express-mongo-sanitize` | Strips `$` and `.` from request bodies |
| Input validation | `zod` | Schema validation on all request bodies |
| Error responses | Custom error handler | Never exposes stack traces in production |

### Environment
- All secrets in `.env`, validated at startup with `zod` — server refuses to start if any required var is missing
- `.env.example` committed with placeholder values; `.env` git-ignored
- `NODE_ENV` controls: cookie `Secure` flag, CORS strictness, error detail in API responses

### Database
- Mongoose schema validation as a second layer after zod
- User model always excludes `password` and `refreshToken` from API responses via `.select()`
- No raw queries — all DB access through Mongoose models

---

## 5. Data Models

### User
```
_id         ObjectId
name        String, required
email       String, unique, required, lowercase
password    String, required (bcrypt hashed, never returned in responses)
refreshToken String (hashed, nullable)
createdAt   Date
updatedAt   Date
```

### Conversation
```
_id         ObjectId
userId      ObjectId (ref: User), required, indexed
title       String (auto-generated from first user message, max 60 chars)
model       String (model id from config.models.available)
createdAt   Date
updatedAt   Date
```

### Message
```
_id             ObjectId
conversationId  ObjectId (ref: Conversation), required, indexed
role            Enum: "user" | "assistant"
content         String, required
tokens          Number (usage count, populated on assistant messages)
createdAt       Date
```

---

## 6. API Endpoints

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account (name, email, password) |
| POST | `/login` | Issue access + refresh tokens as cookies |
| POST | `/refresh` | Rotate refresh token, issue new access token |
| POST | `/logout` | Clear cookies, delete refresh token from DB |

### Conversations — `/api/conversations` *(auth required)*
| Method | Path | Description |
|---|---|---|
| GET | `/` | Paginated list of user's conversations |
| POST | `/` | Create new conversation |
| PATCH | `/:id` | Rename conversation title |
| DELETE | `/:id` | Delete conversation and all its messages |

### Messages — `/api/conversations/:id/messages` *(auth required)*
| Method | Path | Description |
|---|---|---|
| GET | `/` | Paginated message history for a conversation |

### AI Streaming — `/api/ai` *(auth required)*
| Method | Path | Description |
|---|---|---|
| POST | `/stream/:conversationId` | Save user message, stream SSE response, persist assistant message |

### SSE Event Protocol
```
data: {"type":"token","content":"Hello"}
data: {"type":"token","content":" world"}
data: {"type":"done","messageId":"abc123","tokens":42}
data: {"type":"error","message":"upstream timeout"}
```

---

## 7. UI/UX

### Layout
- **Sidebar (left, 260px):** New chat button · Scrollable conversation list · Model selector · Theme toggle · User avatar + logout at bottom
- **Main area:** Chat message thread · Streaming token display with blinking cursor · Input textarea (auto-grow) pinned to bottom

### Theme
- Dark/light toggle in sidebar footer
- Persisted in `localStorage`
- Tailwind `darkMode: 'class'` — toggling `dark` class on `<html>`
- Default theme set in `client/src/config/config.js`

### Responsiveness
| Breakpoint | Behavior |
|---|---|
| `xl`+ (1280px+) | Full layout, wider chat area with max-width cap |
| `lg` (1024px) | Standard layout, sidebar always visible |
| `md` (768px) | Sidebar becomes overlay drawer with backdrop |
| `sm` (640px) | Font sizes adjust, input bar stacks |
| Mobile | Touch-friendly 44×44px tap targets, no horizontal overflow |

All sizing uses `flex`, `grid`, `w-full`, `max-w-*` — no fixed pixel widths in layout.

### Chat Features
- Markdown rendering in assistant messages (code blocks with syntax highlighting, bold, lists)
- **Reasoning display:** `reasoning_content` streamed into a collapsible "Thinking..." block above the answer (collapsed by default, expandable — Claude-style)
- Copy button on each assistant message
- Auto-scroll to bottom during streaming; "scroll to bottom" FAB when user scrolls up
- Empty state with suggested prompts on new conversations
- Character counter near input (limit from `config.chat.maxMessageLength`)

### Auth Pages
- Centered card layout for Login and Register
- Inline zod validation errors shown below each field
- Redirect to `/chat` on successful login

---

## 8. Dependencies

### Server
```
express, mongoose, jsonwebtoken, bcryptjs, cookie-parser
helmet, cors, express-rate-limit, express-mongo-sanitize
zod, openai, dotenv, nodemon (dev)
```

### Client
```
react, react-dom, react-router-dom
zustand, @tanstack/react-query
axios
tailwindcss, @tailwindcss/typography
react-markdown, react-syntax-highlighter
zod, react-hook-form, @hookform/resolvers
```

---

## 9. Environment Variables

### Server `.env`
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatbot
JWT_ACCESS_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
NVIDIA_API_KEY=<your-nvidia-nim-api-key>
ALLOWED_ORIGINS=http://localhost:5173
```

### Client `.env`
```
VITE_API_URL=http://localhost:5000
```
