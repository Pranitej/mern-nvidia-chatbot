# MERN AI Chatbot

A full-stack AI chatbot application built with the MERN stack, streaming real-time responses from NVIDIA-hosted large language models via Server-Sent Events. Features JWT authentication, multi-model support, per-message model switching, and stream interruption.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Application Flow](#application-flow)
   - [Authentication Flow](#authentication-flow)
   - [Chat & Streaming Flow](#chat--streaming-flow)
   - [Stream Abort Flow](#stream-abort-flow)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Security](#security)
8. [Configuration](#configuration)
9. [Setup & Running](#setup--running)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Vite | UI, routing, build |
| **State** | Zustand + TanStack Query | Client & server state |
| **Styling** | Tailwind CSS v4 | Utility-first CSS, dark/light themes |
| **Backend** | Node.js + Express | REST API + SSE streaming |
| **Database** | MongoDB + Mongoose | Conversations, messages, users |
| **AI Provider** | NVIDIA NIM (`integrate.api.nvidia.com`) | LLM inference |
| **Auth** | JWT (access + refresh tokens) | Stateless authentication |
| **Validation** | Zod (client + server) | Runtime schema validation |
| **Logging** | Pino | Structured JSON logging |
| **Testing** | Vitest | Server-side unit tests |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER                             │
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  Auth Pages │    │  Chat Page   │    │ Profile Modal │  │
│  │  (Login /   │    │  (Sidebar +  │    │ (name, email, │  │
│  │  Register)  │    │  ChatArea)   │    │  password)    │  │
│  └──────┬──────┘    └──────┬───────┘    └───────┬───────┘  │
│         │                  │                    │           │
│  ┌──────▼──────────────────▼────────────────────▼───────┐  │
│  │              Zustand Stores                           │  │
│  │   authStore │ chatStore │ themeStore                 │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │          HTTP Layer (Axios + useSSE)                  │  │
│  │   Token refresh interceptor │ SSE stream reader       │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────┐
│                    EXPRESS SERVER                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌────────────┐  │
│  │ Helmet   │  │   CORS   │  │  Rate   │  │   Mongo    │  │
│  │ Headers  │  │ Origins  │  │ Limiter │  │  Sanitize  │  │
│  └──────────┘  └──────────┘  └─────────┘  └────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Routes                            │    │
│  │  /api/auth  │  /api/conversations  │  /api/ai      │    │
│  └──────┬──────────────┬──────────────────┬────────────┘    │
│         │              │                  │                 │
│  ┌──────▼──────┐ ┌─────▼──────┐  ┌───────▼────────┐        │
│  │   Auth      │ │   Conv     │  │  AI Controller │        │
│  │ Controller  │ │ Controller │  │  (SSE stream)  │        │
│  └──────┬──────┘ └─────┬──────┘  └───────┬────────┘        │
│         │              │                  │                 │
│  ┌──────▼──────────────▼──────┐  ┌───────▼────────┐        │
│  │        MongoDB             │  │  NVIDIA Service│        │
│  │  Users │ Conversations     │  │  (OpenAI SDK)  │        │
│  │  Messages                  │  └───────┬────────┘        │
│  └────────────────────────────┘          │                 │
└─────────────────────────────────────────┼─────────────────┘
                                          │ HTTPS
                             ┌────────────▼───────────┐
                             │    NVIDIA NIM API      │
                             │  integrate.api.nvidia  │
                             │  .com/v1               │
                             │                        │
                             │  • DeepSeek V3.1 685B  │
                             │  • Llama 3.3 70B       │
                             │  • Nemotron Super 49B  │
                             └────────────────────────┘
```

---

## Project Structure

```
Chatbot/
├── server/
│   ├── server.js                  # Entry point — starts HTTP server
│   ├── app.js                     # Express app — middleware + routes
│   ├── config/
│   │   ├── env.js                 # Zod-validated env vars
│   │   ├── config.js              # Models, auth, rate limits, pagination
│   │   ├── db.js                  # MongoDB connection
│   │   └── logger.js              # Pino structured logger
│   ├── models/
│   │   ├── User.js                # name, email, password (hashed), refreshToken
│   │   ├── Conversation.js        # userId, title, model, timestamps
│   │   └── Message.js             # conversationId, role, content, reasoning, tokens
│   ├── routes/
│   │   ├── auth.js                # /api/auth/*
│   │   ├── conversations.js       # /api/conversations/*
│   │   └── ai.js                  # /api/ai/stream/:id
│   ├── controllers/
│   │   ├── authController.js      # register, login, refresh, logout, profile, password
│   │   ├── conversationController.js
│   │   ├── messageController.js
│   │   └── aiController.js        # SSE streaming + abort detection
│   ├── services/
│   │   └── nvidiaService.js       # OpenAI-SDK wrapper for NVIDIA NIM
│   ├── middleware/
│   │   ├── auth.js                # requireAuth — JWT validation
│   │   ├── rateLimiter.js         # Per-endpoint rate limits
│   │   └── errorHandler.js        # Global error + 404 handler
│   └── tests/
│
└── client/
    └── src/
        ├── main.jsx               # React entry point + QueryClientProvider
        ├── App.jsx                # Routes + auth initialisation
        ├── index.css              # CSS variables (theme), scrollbar, typography
        ├── config/
        │   └── config.js          # API URL, models, chat limits, UI defaults
        ├── api/
        │   ├── axios.js           # Axios instance + refresh token interceptor
        │   ├── auth.js            # Auth API calls
        │   └── conversations.js   # Conversations API calls
        ├── hooks/
        │   ├── useSSE.js          # Fetch-based SSE reader + AbortController
        │   ├── useConversations.js # React Query: list, create, rename, delete
        │   └── useMessages.js     # React Query: load message history
        ├── store/
        │   ├── authStore.js       # user, isAuthenticated, isLoading
        │   ├── chatStore.js       # conversations, messages, streaming state, selectedModelId
        │   └── themeStore.js      # dark/light, persisted to localStorage
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx   # + password strength meter + debounced email check
        │   ├── ChatPage.jsx       # Sidebar + ChatArea + reactive model badge
        │   └── ProfileModal.jsx   # Name/email editing + password change
        └── components/
            ├── chat/
            │   ├── MessageInput.jsx   # Textarea + model pill + send/stop button
            │   ├── MessageBubble.jsx  # Markdown, code highlight, model badge
            │   ├── ThinkingBlock.jsx  # Collapsible chain-of-thought reasoning
            │   └── EmptyState.jsx     # Suggested prompts
            ├── layout/
            │   ├── ChatArea.jsx       # Message list + streaming bubble + scroll
            │   └── Sidebar.jsx        # Conversation list + new chat + user footer
            └── ui/
                └── ThemeToggle.jsx
```

---

## Application Flow

### Authentication Flow

```
┌──────────┐         ┌──────────────┐         ┌──────────────┐
│  Client  │         │    Server    │         │   MongoDB    │
└────┬─────┘         └──────┬───────┘         └──────┬───────┘
     │                      │                        │
     │  POST /api/auth/login │                        │
     │  { email, password }  │                        │
     │──────────────────────>│                        │
     │                       │  findOne({ email })    │
     │                       │───────────────────────>│
     │                       │<───────────────────────│
     │                       │                        │
     │                       │  bcrypt.compare()      │
     │                       │  ✓ password match      │
     │                       │                        │
     │                       │  sign accessToken (15m)│
     │                       │  sign refreshToken (7d)│
     │                       │  hash + save refresh   │
     │                       │───────────────────────>│
     │                       │                        │
     │  Set-Cookie: accessToken (HttpOnly)             │
     │  Set-Cookie: refreshToken (HttpOnly)            │
     │<──────────────────────│                        │
     │                       │                        │
     │  [subsequent requests]│                        │
     │──────────────────────>│                        │
     │  Cookie: accessToken  │  JWT.verify()          │
     │                       │  attach req.user       │
     │                       │                        │
     │  [token expires — 401]│                        │
     │<──────────────────────│                        │
     │                       │                        │
     │  POST /api/auth/refresh                        │
     │  Cookie: refreshToken │                        │
     │──────────────────────>│                        │
     │                       │  verify + hash compare │
     │                       │  issue new accessToken │
     │<──────────────────────│                        │
     │  retry original request                        │
     │──────────────────────>│                        │
```

> **Token Refresh Queue** — if multiple requests hit a 401 simultaneously, only one refresh call is made. All other requests are queued and retried once the new token arrives.

---

### Chat & Streaming Flow

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Client  │    │   ChatArea   │    │    Server    │    │  NVIDIA NIM  │
└────┬─────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
     │                 │                    │                    │
     │  Type message   │                    │                    │
     │  Select model   │                    │                    │
     │────────────────>│                    │                    │
     │                 │  handleSend()      │                    │
     │                 │  addUserMessage()  │                    │
     │                 │  [optimistic UI]   │                    │
     │                 │                    │                    │
     │                 │  POST /api/ai/stream/:conversationId    │
     │                 │  { content, model }│                    │
     │                 │───────────────────>│                    │
     │                 │                    │  save user message │
     │                 │                    │  fetch history     │
     │                 │                    │  set SSE headers   │
     │                 │                    │                    │
     │                 │                    │  streamChat()      │
     │                 │                    │───────────────────>│
     │                 │                    │                    │
     │                 │  data: {type:"token", content:"Hi"}     │
     │                 │<───────────────────│<───────────────────│
     │  appendToken()  │                    │                    │
     │<────────────────│                    │                    │
     │  [streaming     │                    │                    │
     │   bubble grows] │  data: {type:"token", content:"..."}   │
     │                 │<───────────────────│<───────────────────│
     │                 │  ...               │                    │
     │                 │                    │                    │
     │                 │  data: {type:"done", messageId, tokens} │
     │                 │<───────────────────│                    │
     │                 │  finalizeStream()  │  Message.create()  │
     │                 │  [bubble becomes   │  (assistant msg)   │
     │                 │   a real message]  │                    │
```

**SSE Event Types:**

| Event | Payload | Description |
|-------|---------|-------------|
| `token` | `{ content: string }` | One streamed token chunk |
| `reasoning` | `{ content: string }` | Chain-of-thought thinking (some models) |
| `done` | `{ messageId, tokens, model }` | Stream complete, message saved |
| `error` | `{ message: string }` | Stream error |

---

### Stream Abort Flow

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│  Client  │    │   useSSE.js  │    │    Server    │
└────┬─────┘    └──────┬───────┘    └──────┬───────┘
     │                 │                    │
     │  [streaming in  │                    │
     │   progress...]  │                    │
     │                 │                    │
     │  Click ■ Stop   │                    │
     │────────────────>│                    │
     │                 │  abortController   │
     │                 │  .abort()          │
     │                 │                    │
     │                 │  fetch() throws    │
     │                 │  AbortError        │
     │                 │  clearStream()     │  TCP connection closed
     │                 │  [isStreaming=false]│──────────────────────>
     │  [stop button   │                    │  req.on('close') fires
     │   → send button]│                    │  aborted = true
     │                 │                    │
     │  [input enabled]│                    │  onToken() → no-op
     │                 │                    │  onDone()  → skip
     │                 │                    │  Message.create() skipped
     │                 │                    │  (partial msg NOT saved)
     │                 │                    │  res.end()
```

> **Generation counter** — prevents a race condition where the old stream's `clearStream()` fires after a new stream has already started.

---

## API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/register` | — | `{ name, email, password }` | Create account |
| POST | `/login` | — | `{ email, password }` | Login, set cookies |
| POST | `/refresh` | cookie | — | Refresh access token |
| POST | `/logout` | cookie | — | Clear tokens |
| GET | `/me` | ✓ | — | Get current user |
| GET | `/check-email?email=` | ✓ | — | Check email availability |
| PUT | `/profile` | ✓ | `{ name?, email? }` | Update profile |
| PUT | `/password` | ✓ | `{ currentPassword, newPassword }` | Change password |

### Conversations — `/api/conversations`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| GET | `/` | ✓ | — | List conversations (paginated) |
| POST | `/` | ✓ | `{ title?, model? }` | Create conversation |
| PATCH | `/:id` | ✓ | `{ title }` | Rename conversation |
| DELETE | `/:id` | ✓ | — | Delete conversation |
| GET | `/:id/messages` | ✓ | — | Get message history |

### AI Streaming — `/api/ai`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/stream/:conversationId` | ✓ | `{ content, model? }` | Start SSE stream |

**Rate limits:** Auth: 10 req/min · API: 60 req/min · Stream: 20 req/min

---

## Database Schema

### User
```
users
├── name          String  required  max:50
├── email         String  required  unique  lowercase
├── password      String  required  (bcrypt hash, 12 rounds)
├── refreshToken  String  (hashed, select:false)
├── createdAt     Date
└── updatedAt     Date
```

### Conversation
```
conversations
├── userId        ObjectId  ref:User  required  indexed
├── title         String    required  max:100   default:"New Conversation"
├── model         String    default:"deepseek-ai/deepseek-v3.1"
├── createdAt     Date
└── updatedAt     Date
```

### Message
```
messages
├── conversationId  ObjectId  ref:Conversation  required  indexed
├── role            String    enum:["user","assistant"]   required
├── content         String    required
├── reasoning       String    default:""  (chain-of-thought)
├── tokens          Number    default:0
├── createdAt       Date
└── updatedAt       Date
```

---

## Security

### Authentication & Authorisation
| Measure | Detail |
|---------|--------|
| Password hashing | bcryptjs, 12 rounds |
| Access token | JWT, 15-minute expiry, HttpOnly cookie |
| Refresh token | JWT, 7-day expiry, stored hashed in DB, HttpOnly cookie |
| Token refresh | Single refresh attempt queued — concurrent 401s share one refresh call |
| Route protection | `requireAuth` middleware validates JWT on every protected route |

### Transport & Headers
| Measure | Detail |
|---------|--------|
| Helmet | Sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, and 10+ other headers |
| CORS | Restricted to `ALLOWED_ORIGINS` env var — no wildcard in production |
| Cookie flags | `HttpOnly`, `SameSite=Strict`, `Secure` in production |

### Input Validation & Injection Prevention
| Measure | Detail |
|---------|--------|
| Zod schemas | All request bodies validated server-side before reaching controllers |
| NoSQL injection | `express-mongo-sanitize` strips `$` and `.` from user input |
| JSON size limit | Express body parser capped at 10kb |
| Environment variables | Zod validates all env vars at startup — server refuses to start with missing/invalid config |

### Rate Limiting
| Endpoint group | Window | Max requests |
|---------------|--------|-------------|
| `/api/auth/*` | 60 s | 10 |
| `/api/*` (general) | 60 s | 60 |
| `/api/ai/stream` | 60 s | 20 |

### Data Security
| Measure | Detail |
|---------|--------|
| Conversation scoping | All queries include `userId: req.user.id` — users can only access their own data |
| Refresh token hashing | Stored as bcrypt hash — raw token is never persisted |
| Error messages | Production errors are generic (`Internal Server Error`) — no stack traces leaked |
| Partial response discard | Aborted streams skip `Message.create()` — incomplete AI responses are never saved |

---

## Configuration

### Server `server/config/config.js`
```js
models: {
  default: 'deepseek-ai/deepseek-v3.1',
  available: [
    { id: 'deepseek-ai/deepseek-v3.1',                label: 'DeepSeek V3.1 685B',  provider: 'nvidia' },
    { id: 'meta/llama-3.3-70b-instruct',              label: 'Llama 3.3 70B',       provider: 'nvidia' },
    { id: 'nvidia/llama-3.3-nemotron-super-49b-v1',   label: 'Nemotron Super 49B',  provider: 'nvidia' },
  ],
},
ai: {
  maxTokens: 8192,
  temperature: 1,
  topP: 0.95,
  baseURL: 'https://integrate.api.nvidia.com/v1',
  streamTimeout: 60_000,
},
auth: {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  bcryptRounds: 12,
},
rateLimit: {
  auth:   { windowMs: 60_000, max: 10 },
  api:    { windowMs: 60_000, max: 60 },
  stream: { windowMs: 60_000, max: 20 },
},
```

### Environment Variables

Create `server/.env` from `server/.env.example`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatbot
JWT_ACCESS_SECRET=<min-32-char-random-secret>
JWT_REFRESH_SECRET=<min-32-char-random-secret>
NVIDIA_API_KEY=<from-build.nvidia.com>
ALLOWED_ORIGINS=http://localhost:5173
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- NVIDIA NIM API key — free tier at [build.nvidia.com](https://build.nvidia.com)

### Install & Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd Chatbot

# 2. Server setup
cd server
npm install
cp .env.example .env
# → Edit .env with your MongoDB URI, JWT secrets, and NVIDIA API key
npm run dev

# 3. Client setup (new terminal)
cd client
npm install
npm run dev

# 4. Open in browser
# http://localhost:5173
```

### Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `server/` | `npm run dev` | Start server with auto-reload (`node --watch`) |
| `server/` | `npm start` | Production start |
| `server/` | `npm test` | Run Vitest test suite |
| `client/` | `npm run dev` | Start Vite dev server (HMR) |
| `client/` | `npm run build` | Build for production → `dist/` |
| `client/` | `npm run preview` | Preview production build |

### Production Build

```bash
# Build client
cd client && npm run build
# Serve dist/ with a static file server or Express static middleware

# Run server
cd server && npm start
```
