# Production-Grade MERN Chatbot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade MERN chatbot with JWT auth, multiple persistent conversations, real-time SSE streaming via NVIDIA DeepSeek V3.2, and a responsive Claude-style UI with dark/light theme.

**Architecture:** REST API + SSE streaming on Express, JWT in httpOnly cookies, MongoDB via Mongoose, React 19 + Tailwind v4 frontend with Zustand state and React Query data fetching. Reasoning shown as collapsible "Thinking..." block (Claude-style).

**Tech Stack:** Node.js/Express, MongoDB/Mongoose, JWT, bcryptjs, helmet, zod, openai SDK, React 19, Vite 8, Tailwind v4, Zustand v5, TanStack Query v5, React Router v7, react-markdown, react-syntax-highlighter, react-hook-form

---

## File Map

### Server (create unless noted)
- `server/package.json` — **modify**: add all deps, set `"type":"module"`
- `server/.env` — secrets (git-ignored)
- `server/.env.example` — placeholder values
- `server/.gitignore`
- `server/vitest.config.js` — test config
- `server/app.js` — Express app export (for testing)
- `server/server.js` — **modify**: entry point, calls app.listen
- `server/config/env.js` — zod env validation
- `server/config/config.js` — central config
- `server/config/db.js` — mongoose connection
- `server/models/User.js`
- `server/models/Conversation.js`
- `server/models/Message.js`
- `server/middleware/auth.js` — JWT cookie guard
- `server/middleware/rateLimiter.js`
- `server/middleware/errorHandler.js`
- `server/controllers/authController.js`
- `server/controllers/conversationController.js`
- `server/controllers/messageController.js`
- `server/controllers/aiController.js`
- `server/routes/auth.js`
- `server/routes/conversations.js`
- `server/routes/ai.js`
- `server/services/nvidiaService.js`
- `server/tests/setup.js` — mongodb-memory-server setup
- `server/tests/auth.test.js`
- `server/tests/conversations.test.js`

### Client (create unless noted)
- `client/package.json` — **modify**: add all deps
- `client/vite.config.js` — **modify**: add Tailwind plugin + /api proxy
- `client/index.html` — **modify**: add Inter font
- `client/src/index.css` — **modify**: Tailwind v4 directives + CSS vars
- `client/src/App.jsx` — **replace**: React Router setup
- `client/src/main.jsx` — **modify**: wrap with QueryClientProvider
- `client/src/config/config.js`
- `client/src/api/axios.js`
- `client/src/api/auth.js`
- `client/src/api/conversations.js`
- `client/src/store/authStore.js`
- `client/src/store/chatStore.js`
- `client/src/store/themeStore.js`
- `client/src/hooks/useSSE.js`
- `client/src/hooks/useConversations.js`
- `client/src/hooks/useMessages.js`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/RegisterPage.jsx`
- `client/src/pages/ChatPage.jsx`
- `client/src/components/layout/Sidebar.jsx`
- `client/src/components/layout/ChatArea.jsx`
- `client/src/components/chat/MessageBubble.jsx`
- `client/src/components/chat/ThinkingBlock.jsx`
- `client/src/components/chat/MessageInput.jsx`
- `client/src/components/chat/EmptyState.jsx`
- `client/src/components/ui/ThemeToggle.jsx`
- `client/src/components/ui/ModelSelector.jsx`

---

## Task 1: Server Dependencies & Project Scaffold

**Files:**
- Modify: `server/package.json`
- Create: `server/.env`, `server/.env.example`, `server/.gitignore`, `server/vitest.config.js`

- [ ] **Step 1: Install server dependencies**

```bash
cd server
npm install express mongoose jsonwebtoken bcryptjs cookie-parser helmet cors express-rate-limit express-mongo-sanitize zod openai dotenv
npm install -D vitest supertest @vitest/coverage-v8 mongodb-memory-server
```

- [ ] **Step 2: Update server/package.json**

```json
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch server.js",
    "start": "node server.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^4.21.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.14.1",
    "openai": "^4.96.2",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^3.1.3",
    "mongodb-memory-server": "^10.1.4",
    "supertest": "^7.1.0",
    "vitest": "^3.1.3"
  }
}
```

- [ ] **Step 3: Create server/vitest.config.js**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    testTimeout: 30000,
  },
});
```

- [ ] **Step 4: Create server/.env**

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatbot
JWT_ACCESS_SECRET=change_this_access_secret_min_32_chars
JWT_REFRESH_SECRET=change_this_refresh_secret_min_32_chars
NVIDIA_API_KEY=your_nvidia_api_key_here
ALLOWED_ORIGINS=http://localhost:5173
```

- [ ] **Step 5: Create server/.env.example**

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatbot
JWT_ACCESS_SECRET=<strong-random-secret-min-32-chars>
JWT_REFRESH_SECRET=<strong-random-secret-min-32-chars>
NVIDIA_API_KEY=<get-from-build.nvidia.com>
ALLOWED_ORIGINS=http://localhost:5173
```

- [ ] **Step 6: Create server/.gitignore**

```
node_modules/
.env
coverage/
```

- [ ] **Step 7: Commit**

```bash
git add server/package.json server/.env.example server/.gitignore server/vitest.config.js
git commit -m "feat: server project scaffold and dependencies"
```

---

## Task 2: Env Validation & Central Config

**Files:**
- Create: `server/config/env.js`, `server/config/config.js`

- [ ] **Step 1: Create server/config/env.js**

```js
import { z } from 'zod';
import 'dotenv/config';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  NVIDIA_API_KEY: z.string().min(1),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

- [ ] **Step 2: Create server/config/config.js**

```js
import { env } from './env.js';

export const config = {
  models: {
    default: 'deepseek-ai/deepseek-v3.2',
    available: [
      { id: 'deepseek-ai/deepseek-v3.2', label: 'DeepSeek V3.2 685B', provider: 'nvidia' },
    ],
  },
  ai: {
    maxTokens: 8192,
    temperature: 1,
    topP: 0.95,
    thinking: true,
    baseURL: 'https://integrate.api.nvidia.com/v1',
    streamTimeout: 60_000,
  },
  auth: {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
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
    origins: env.ALLOWED_ORIGINS.split(',').map(o => o.trim()),
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add server/config/
git commit -m "feat: env validation and central config"
```

---

## Task 3: Database Connection & Mongoose Models

**Files:**
- Create: `server/config/db.js`, `server/models/User.js`, `server/models/Conversation.js`, `server/models/Message.js`

- [ ] **Step 1: Create server/config/db.js**

```js
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}
```

- [ ] **Step 2: Create server/models/User.js**

```js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true, maxlength: 50 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, select: false },
  refreshToken: { type: String, select: false },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
```

- [ ] **Step 3: Create server/models/Conversation.js**

```js
import mongoose from 'mongoose';
import { config } from '../config/config.js';

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:  { type: String, required: true, trim: true, maxlength: 100 },
  model:  { type: String, default: config.models.default },
}, { timestamps: true });

export const Conversation = mongoose.model('Conversation', conversationSchema);
```

- [ ] **Step 4: Create server/models/Message.js**

```js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  role:    { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  reasoning: { type: String, default: '' },
  tokens:  { type: Number, default: 0 },
}, { timestamps: true });

export const Message = mongoose.model('Message', messageSchema);
```

- [ ] **Step 5: Commit**

```bash
git add server/config/db.js server/models/
git commit -m "feat: database connection and mongoose models"
```

---

## Task 4: Security Middleware Stack

**Files:**
- Create: `server/middleware/rateLimiter.js`, `server/middleware/errorHandler.js`

- [ ] **Step 1: Create server/middleware/rateLimiter.js**

```js
import rateLimit from 'express-rate-limit';
import { config } from '../config/config.js';

function createLimiter(key) {
  const { windowMs, max } = config.rateLimit[key];
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
}

export const authLimiter   = createLimiter('auth');
export const apiLimiter    = createLimiter('api');
export const streamLimiter = createLimiter('stream');
```

- [ ] **Step 2: Create server/middleware/errorHandler.js**

```js
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}
```

- [ ] **Step 3: Commit**

```bash
git add server/middleware/rateLimiter.js server/middleware/errorHandler.js
git commit -m "feat: rate limiter and error handler middleware"
```

---

## Task 5: Auth Middleware (JWT Guard)

**Files:**
- Create: `server/middleware/auth.js`

- [ ] **Step 1: Create server/middleware/auth.js**

```js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/middleware/auth.js
git commit -m "feat: JWT auth middleware"
```

---

## Task 6: Auth Controller

**Files:**
- Create: `server/controllers/authController.js`

- [ ] **Step 1: Create server/controllers/authController.js**

```js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { config } from '../config/config.js';

const registerSchema = z.object({
  name:     z.string().min(1).max(50),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function issueTokens(res, user) {
  const payload = { id: user._id, email: user.email };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: config.auth.accessTokenExpiry,
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: config.auth.refreshTokenExpiry,
  });

  const cookieOpts = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: config.auth.cookieMaxAge });

  return refreshToken;
}

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(data.password, config.auth.bcryptRounds);
    const user = await User.create({ name: data.name, email: data.email, password: hashed });

    const refreshToken = issueTokens(res, user);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const refreshToken = issueTokens(res, user);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || !user.refreshToken) return res.status(401).json({ error: 'Invalid session' });

    const valid = await bcrypt.compare(token, user.refreshToken);
    if (!valid) return res.status(401).json({ error: 'Invalid session' });

    const newRefresh = issueTokens(res, user);
    const hashedRefresh = await bcrypt.hash(newRefresh, 10);
    await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      } catch (_) {}
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user._id, name: user.name, email: user.email } });
}
```

- [ ] **Step 2: Commit**

```bash
git add server/controllers/authController.js
git commit -m "feat: auth controller (register, login, refresh, logout)"
```

---

## Task 7: Auth Routes & Tests

**Files:**
- Create: `server/routes/auth.js`, `server/tests/setup.js`, `server/tests/auth.test.js`

- [ ] **Step 1: Create server/routes/auth.js**

```js
import { Router } from 'express';
import { register, login, refresh, logout, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.post('/refresh',  refresh);
router.post('/logout',   logout);
router.get('/me',        requireAuth, getMe);

export default router;
```

- [ ] **Step 2: Create server/tests/setup.js**

```js
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
```

- [ ] **Step 3: Create server/tests/auth.test.js**

```js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('POST /api/auth/register', () => {
  it('creates a user and sets cookies', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('rejects weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: '123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('returns user and sets cookies on valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@test.com');
  });

  it('rejects invalid password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without auth cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns user when authenticated', async () => {
    const loginRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@test.com');
  });
});
```

- [ ] **Step 4: Create server/app.js** (needed before running tests)

```js
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from './config/config.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
```

- [ ] **Step 5: Run tests**

```bash
cd server && npm test
```
Expected: all 5 auth tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/app.js server/routes/auth.js server/tests/
git commit -m "feat: auth routes and integration tests"
```

---

## Task 8: Conversation Controller & Routes

**Files:**
- Create: `server/controllers/conversationController.js`, `server/routes/conversations.js`, `server/tests/conversations.test.js`

- [ ] **Step 1: Create server/controllers/conversationController.js**

```js
import { z } from 'zod';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { config } from '../config/config.js';

const createSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  model: z.string().optional(),
});

const renameSchema = z.object({
  title: z.string().min(1).max(100),
});

export async function listConversations(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = config.pagination.conversationsPerPage;
    const skip  = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      Conversation.find({ userId: req.user.id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments({ userId: req.user.id }),
    ]);

    res.json({ conversations, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function createConversation(req, res, next) {
  try {
    const data = createSchema.parse(req.body);
    const conversation = await Conversation.create({
      userId: req.user.id,
      title:  data.title || 'New Conversation',
      model:  data.model || config.models.default,
    });
    res.status(201).json({ conversation });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

export async function renameConversation(req, res, next) {
  try {
    const data = renameSchema.parse(req.body);
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title: data.title },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ conversation });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

export async function deleteConversation(req, res, next) {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    await Message.deleteMany({ conversationId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 2: Create server/controllers/messageController.js**

```js
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { config } from '../config/config.js';

export async function listMessages(req, res, next) {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = config.pagination.messagesPerPage;
    const skip  = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ conversationId: req.params.id })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ conversationId: req.params.id }),
    ]);

    res.json({ messages, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Create server/routes/conversations.js**

```js
import { Router } from 'express';
import { listConversations, createConversation, renameConversation, deleteConversation } from '../controllers/conversationController.js';
import { listMessages } from '../controllers/messageController.js';
import { requireAuth } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(requireAuth, apiLimiter);

router.get('/',          listConversations);
router.post('/',         createConversation);
router.patch('/:id',     renameConversation);
router.delete('/:id',    deleteConversation);
router.get('/:id/messages', listMessages);

export default router;
```

- [ ] **Step 4: Add conversations routes to server/app.js**

```js
// Add after authRoutes import:
import conversationRoutes from './routes/conversations.js';

// Add after app.use('/api/auth', authRoutes):
app.use('/api/conversations', conversationRoutes);
```

- [ ] **Step 5: Create server/tests/conversations.test.js**

```js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

async function getAuthCookies() {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });
  return res.headers['set-cookie'];
}

describe('GET /api/conversations', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/conversations');
    expect(res.status).toBe(401);
  });

  it('returns empty list for new user', async () => {
    const cookies = await getAuthCookies();
    const res = await request(app)
      .get('/api/conversations')
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.conversations).toHaveLength(0);
  });
});

describe('POST /api/conversations', () => {
  it('creates a conversation', async () => {
    const cookies = await getAuthCookies();
    const res = await request(app)
      .post('/api/conversations')
      .set('Cookie', cookies)
      .send({ title: 'Test Chat' });
    expect(res.status).toBe(201);
    expect(res.body.conversation.title).toBe('Test Chat');
  });
});

describe('DELETE /api/conversations/:id', () => {
  it('deletes conversation and returns ok', async () => {
    const cookies = await getAuthCookies();
    const create = await request(app)
      .post('/api/conversations')
      .set('Cookie', cookies)
      .send({ title: 'To Delete' });

    const res = await request(app)
      .delete(`/api/conversations/${create.body.conversation._id}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
```

- [ ] **Step 6: Run tests**

```bash
cd server && npm test
```
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add server/controllers/ server/routes/conversations.js server/tests/conversations.test.js
git commit -m "feat: conversation and message controllers, routes, and tests"
```

---

## Task 9: NVIDIA Service & AI Streaming Controller

**Files:**
- Create: `server/services/nvidiaService.js`, `server/controllers/aiController.js`, `server/routes/ai.js`

- [ ] **Step 1: Create server/services/nvidiaService.js**

```js
import OpenAI from 'openai';
import { env } from '../config/env.js';
import { config } from '../config/config.js';

const client = new OpenAI({
  apiKey: env.NVIDIA_API_KEY,
  baseURL: config.ai.baseURL,
});

export async function streamChat({ messages, model, onToken, onReasoning, onDone, onError }) {
  try {
    const stream = await client.chat.completions.create({
      model: model || config.models.default,
      messages,
      temperature: config.ai.temperature,
      top_p: config.ai.topP,
      max_tokens: config.ai.maxTokens,
      chat_template_kwargs: { thinking: config.ai.thinking },
      stream: true,
    });

    let fullContent   = '';
    let fullReasoning = '';
    let usage = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      const reasoning = delta.reasoning_content;
      const content   = delta.content;

      if (reasoning) {
        fullReasoning += reasoning;
        onReasoning?.(reasoning);
      }

      if (content) {
        fullContent += content;
        onToken(content);
      }

      if (chunk.usage) usage = chunk.usage.completion_tokens || 0;
    }

    onDone({ content: fullContent, reasoning: fullReasoning, tokens: usage });
  } catch (err) {
    onError(err);
  }
}
```

- [ ] **Step 2: Create server/controllers/aiController.js**

```js
import { z } from 'zod';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { streamChat } from '../services/nvidiaService.js';
import { config } from '../config/config.js';

const streamSchema = z.object({
  content: z.string().min(1).max(config.chat?.maxMessageLength ?? 4000),
});

export async function streamMessage(req, res, next) {
  try {
    const { content } = streamSchema.parse(req.body);

    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      userId: req.user.id,
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Save user message
    await Message.create({
      conversationId: conversation._id,
      role: 'user',
      content,
    });

    // Auto-title from first message
    if (conversation.title === 'New Conversation') {
      const title = content.slice(0, 60);
      await Conversation.findByIdAndUpdate(conversation._id, { title });
    }
    await Conversation.findByIdAndUpdate(conversation._id, { updatedAt: new Date() });

    // Fetch last 20 messages for context
    const history = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const messages = history.reverse().map(m => ({ role: m.role, content: m.content }));

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    // Set stream timeout
    const timeout = setTimeout(() => {
      send({ type: 'error', message: 'Stream timeout' });
      res.end();
    }, config.ai.streamTimeout);

    await streamChat({
      messages,
      model: conversation.model,
      onToken:     (token)   => send({ type: 'token', content: token }),
      onReasoning: (chunk)   => send({ type: 'reasoning', content: chunk }),
      onDone: async ({ content: fullContent, reasoning, tokens }) => {
        clearTimeout(timeout);
        const msg = await Message.create({
          conversationId: conversation._id,
          role: 'assistant',
          content: fullContent,
          reasoning,
          tokens,
        });
        send({ type: 'done', messageId: msg._id, tokens });
        res.end();
      },
      onError: (err) => {
        clearTimeout(timeout);
        send({ type: 'error', message: err.message || 'Stream error' });
        res.end();
      },
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}
```

- [ ] **Step 3: Create server/routes/ai.js**

```js
import { Router } from 'express';
import { streamMessage } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { streamLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.post('/stream/:conversationId', requireAuth, streamLimiter, streamMessage);

export default router;
```

- [ ] **Step 4: Commit**

```bash
git add server/services/ server/controllers/aiController.js server/routes/ai.js
git commit -m "feat: NVIDIA service and SSE streaming controller"
```

---

## Task 10: Complete server.js

**Files:**
- Modify: `server/server.js`, `server/app.js`

- [ ] **Step 1: Update server/app.js to add AI route**

```js
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from './config/config.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import conversationRoutes from './routes/conversations.js';
import aiRoutes from './routes/ai.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use('/api/auth',          authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/ai',            aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
```

- [ ] **Step 2: Update server/server.js**

```js
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  });
}

start();
```

- [ ] **Step 3: Run all tests**

```bash
cd server && npm test
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add server/app.js server/server.js
git commit -m "feat: complete server entry point with all routes wired"
```

---

## Task 11: Client Dependencies & Tailwind v4 Setup

**Files:**
- Modify: `client/package.json`, `client/vite.config.js`, `client/index.html`, `client/src/index.css`

- [ ] **Step 1: Install client dependencies**

```bash
cd client
npm install react-router-dom zustand @tanstack/react-query axios react-markdown react-syntax-highlighter react-hook-form @hookform/resolvers zod
npm install -D tailwindcss @tailwindcss/vite @tailwindcss/typography
```

- [ ] **Step 2: Update client/vite.config.js**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: Update client/index.html — add Inter font**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
    <title>Chatbot</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Replace client/src/index.css**

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
  --color-sidebar: #171717;
  --color-sidebar-light: #f9f9f9;
  --color-chat-bg: #212121;
  --color-chat-bg-light: #ffffff;
  --color-user-bubble: #2f2f2f;
  --color-user-bubble-light: #f3f4f6;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root {
  height: 100%;
  font-family: var(--font-sans);
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 3px; }
.dark ::-webkit-scrollbar-thumb { background: #374151; }
```

- [ ] **Step 5: Commit**

```bash
git add client/package.json client/vite.config.js client/index.html client/src/index.css
git commit -m "feat: client Tailwind v4, Inter font, Vite proxy"
```

---

## Task 12: Client Config, Axios & API Modules

**Files:**
- Create: `client/src/config/config.js`, `client/src/api/axios.js`, `client/src/api/auth.js`, `client/src/api/conversations.js`

- [ ] **Step 1: Create client/src/config/config.js**

```js
export const config = {
  api: {
    baseURL: import.meta.env.VITE_API_URL ?? '',
    timeout: 30_000,
  },
  chat: {
    maxMessageLength: 4000,
    streamThrottleMs: 30,
  },
  ui: {
    defaultTheme: 'dark',
    sidebarWidth: 260,
  },
  models: {
    available: [
      { id: 'deepseek-ai/deepseek-v3.2', label: 'DeepSeek V3.2 685B' },
    ],
  },
};
```

- [ ] **Step 2: Create client/src/api/axios.js**

```js
import axios from 'axios';
import { config } from '../config/config.js';

const api = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  withCredentials: true,
});

let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => api(original)).catch(e => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await api.post('/api/auth/refresh');
        queue.forEach(p => p.resolve());
        queue = [];
        return api(original);
      } catch (refreshErr) {
        queue.forEach(p => p.reject(refreshErr));
        queue = [];
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
```

- [ ] **Step 3: Create client/src/api/auth.js**

```js
import api from './axios.js';

export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
  logout:   ()     => api.post('/api/auth/logout'),
  me:       ()     => api.get('/api/auth/me'),
};
```

- [ ] **Step 4: Create client/src/api/conversations.js**

```js
import api from './axios.js';

export const conversationsApi = {
  list:   (page = 1)       => api.get(`/api/conversations?page=${page}`),
  create: (data)           => api.post('/api/conversations', data),
  rename: (id, title)      => api.patch(`/api/conversations/${id}`, { title }),
  remove: (id)             => api.delete(`/api/conversations/${id}`),
  messages: (id, page = 1) => api.get(`/api/conversations/${id}/messages?page=${page}`),
};
```

- [ ] **Step 5: Commit**

```bash
git add client/src/config/ client/src/api/
git commit -m "feat: client config, axios instance with refresh interceptor, API modules"
```

---

## Task 13: Zustand Stores

**Files:**
- Create: `client/src/store/authStore.js`, `client/src/store/chatStore.js`, `client/src/store/themeStore.js`

- [ ] **Step 1: Create client/src/store/authStore.js**

```js
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  clearUser: () => set({ user: null, isAuthenticated: false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

- [ ] **Step 2: Create client/src/store/themeStore.js**

```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { config } from '../config/config.js';

export const useThemeStore = create(persist(
  (set, get) => ({
    theme: config.ui.defaultTheme,
    toggle: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark';
      set({ theme: next });
      document.documentElement.classList.toggle('dark', next === 'dark');
    },
    init: () => {
      const theme = get().theme;
      document.documentElement.classList.toggle('dark', theme === 'dark');
    },
  }),
  { name: 'theme' }
));
```

- [ ] **Step 3: Create client/src/store/chatStore.js**

```js
import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  streamingReasoning: '',

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conv) => set(s => ({
    conversations: [conv, ...s.conversations],
    activeConversationId: conv._id,
  })),

  removeConversation: (id) => set(s => ({
    conversations: s.conversations.filter(c => c._id !== id),
    activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
    messages: s.activeConversationId === id ? [] : s.messages,
  })),

  updateConversationTitle: (id, title) => set(s => ({
    conversations: s.conversations.map(c => c._id === id ? { ...c, title } : c),
  })),

  setActiveConversation: (id) => set({ activeConversationId: id, messages: [], streamingContent: '', streamingReasoning: '' }),

  setMessages: (messages) => set({ messages }),

  addUserMessage: (message) => set(s => ({ messages: [...s.messages, message] })),

  startStreaming: () => set({ isStreaming: true, streamingContent: '', streamingReasoning: '' }),

  appendToken: (token) => set(s => ({ streamingContent: s.streamingContent + token })),

  appendReasoning: (chunk) => set(s => ({ streamingReasoning: s.streamingReasoning + chunk })),

  finalizeStream: (messageId, tokens) => set(s => ({
    isStreaming: false,
    messages: [...s.messages, {
      _id: messageId,
      role: 'assistant',
      content: s.streamingContent,
      reasoning: s.streamingReasoning,
      tokens,
      createdAt: new Date().toISOString(),
    }],
    streamingContent: '',
    streamingReasoning: '',
  })),

  clearStream: () => set({ isStreaming: false, streamingContent: '', streamingReasoning: '' }),
}));
```

- [ ] **Step 4: Commit**

```bash
git add client/src/store/
git commit -m "feat: Zustand stores for auth, chat, and theme"
```

---

## Task 14: Hooks

**Files:**
- Create: `client/src/hooks/useSSE.js`, `client/src/hooks/useConversations.js`, `client/src/hooks/useMessages.js`

- [ ] **Step 1: Create client/src/hooks/useConversations.js**

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.js';
import { useChatStore } from '../store/chatStore.js';

export function useConversations() {
  const { setConversations, addConversation, removeConversation, updateConversationTitle } = useChatStore();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await conversationsApi.list();
      setConversations(res.data.conversations);
      return res.data;
    },
  });

  const create = useMutation({
    mutationFn: (data) => conversationsApi.create(data),
    onSuccess: (res) => {
      addConversation(res.data.conversation);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const rename = useMutation({
    mutationFn: ({ id, title }) => conversationsApi.rename(id, title),
    onSuccess: (res) => {
      updateConversationTitle(res.data.conversation._id, res.data.conversation.title);
    },
  });

  const remove = useMutation({
    mutationFn: (id) => conversationsApi.remove(id),
    onSuccess: (_, id) => {
      removeConversation(id);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return { ...query, create, rename, remove };
}
```

- [ ] **Step 2: Create client/src/hooks/useMessages.js**

```js
import { useQuery } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.js';
import { useChatStore } from '../store/chatStore.js';

export function useMessages(conversationId) {
  const { setMessages } = useChatStore();

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await conversationsApi.messages(conversationId);
      setMessages(res.data.messages);
      return res.data;
    },
    enabled: !!conversationId,
  });
}
```

- [ ] **Step 3: Create client/src/hooks/useSSE.js**

```js
import { useCallback } from 'react';
import { useChatStore } from '../store/chatStore.js';

export function useSSE() {
  const { startStreaming, appendToken, appendReasoning, finalizeStream, clearStream } = useChatStore();

  const stream = useCallback(async (conversationId, content) => {
    startStreaming();

    try {
      const res = await fetch(`/api/ai/stream/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Stream request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'token')     appendToken(event.content);
            if (event.type === 'reasoning') appendReasoning(event.content);
            if (event.type === 'done')      finalizeStream(event.messageId, event.tokens);
            if (event.type === 'error')     throw new Error(event.message);
          } catch (_) {}
        }
      }
    } catch (err) {
      clearStream();
      throw err;
    }
  }, [startStreaming, appendToken, appendReasoning, finalizeStream, clearStream]);

  return { stream };
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/hooks/
git commit -m "feat: useConversations, useMessages, and useSSE hooks"
```

---

## Task 15: App Router & Main Entry

**Files:**
- Modify: `client/src/App.jsx`, `client/src/main.jsx`

- [ ] **Step 1: Replace client/src/main.jsx**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
```

- [ ] **Step 2: Replace client/src/App.jsx**

```jsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.jsx';
import { useThemeStore } from './store/themeStore.js';
import { authApi } from './api/auth.js';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ChatPage from './pages/ChatPage.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return (
    <div className="flex h-full items-center justify-center bg-[#212121] dark:bg-[#212121]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { setUser, clearUser } = useAuthStore();
  const { init } = useThemeStore();

  useEffect(() => {
    init();
    authApi.me()
      .then(res => setUser(res.data.user))
      .catch(() => clearUser());
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chat"     element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="*"         element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/App.jsx client/src/main.jsx
git commit -m "feat: React Router setup with protected routes and auth hydration"
```

---

## Task 16: Auth Pages

**Files:**
- Create: `client/src/pages/LoginPage.jsx`, `client/src/pages/RegisterPage.jsx`

- [ ] **Step 1: Create client/src/pages/LoginPage.jsx**

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.js';
import { useAuthStore } from '../store/authStore.jsx';

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export default function LoginPage() {
  const navigate  = useNavigate();
  const { setUser } = useAuthStore();

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data) {
    try {
      const res = await authApi.login(data);
      setUser(res.data.user);
      navigate('/chat');
    } catch (err) {
      setError('root', { message: err.response?.data?.error || 'Login failed' });
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-[#212121] dark:bg-[#212121]">
      <div className="w-full max-w-sm rounded-2xl bg-[#2f2f2f] p-8 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-semibold text-white">Welcome back</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register('email')}
              type="email"
              placeholder="Email"
              className="w-full rounded-lg bg-[#404040] px-4 py-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/20"
            />
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <input
              {...register('password')}
              type="password"
              placeholder="Password"
              className="w-full rounded-lg bg-[#404040] px-4 py-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/20"
            />
            {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
          </div>

          {errors.root && <p className="text-sm text-red-400">{errors.root.message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-white py-3 font-medium text-black transition hover:bg-gray-100 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          No account?{' '}
          <Link to="/register" className="text-white hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create client/src/pages/RegisterPage.jsx**

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.js';
import { useAuthStore } from '../store/authStore.jsx';

const schema = z.object({
  name:     z.string().min(1, 'Name required').max(50),
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});

export default function RegisterPage() {
  const navigate   = useNavigate();
  const { setUser } = useAuthStore();

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data) {
    try {
      const res = await authApi.register(data);
      setUser(res.data.user);
      navigate('/chat');
    } catch (err) {
      setError('root', { message: err.response?.data?.error || 'Registration failed' });
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-[#212121] dark:bg-[#212121]">
      <div className="w-full max-w-sm rounded-2xl bg-[#2f2f2f] p-8 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-semibold text-white">Create account</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register('name')}
              placeholder="Name"
              className="w-full rounded-lg bg-[#404040] px-4 py-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/20"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <input
              {...register('email')}
              type="email"
              placeholder="Email"
              className="w-full rounded-lg bg-[#404040] px-4 py-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/20"
            />
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <input
              {...register('password')}
              type="password"
              placeholder="Password (min 8 chars)"
              className="w-full rounded-lg bg-[#404040] px-4 py-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/20"
            />
            {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
          </div>

          {errors.root && <p className="text-sm text-red-400">{errors.root.message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-white py-3 font-medium text-black transition hover:bg-gray-100 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          Have an account?{' '}
          <Link to="/login" className="text-white hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/LoginPage.jsx client/src/pages/RegisterPage.jsx
git commit -m "feat: login and register pages with validation"
```

---

## Task 17: ThinkingBlock & MessageBubble

**Files:**
- Create: `client/src/components/chat/ThinkingBlock.jsx`, `client/src/components/chat/MessageBubble.jsx`

- [ ] **Step 1: Create client/src/components/chat/ThinkingBlock.jsx**

```jsx
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ThinkingBlock({ reasoning, isStreaming }) {
  const [open, setOpen] = useState(false);

  if (!reasoning && !isStreaming) return null;

  return (
    <div className="mb-3 rounded-xl border border-white/10 bg-white/5 text-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-gray-400 transition hover:text-gray-200"
      >
        {isStreaming && !reasoning ? (
          <span className="flex items-center gap-2">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
            </span>
            Thinking…
          </span>
        ) : (
          <>
            <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Thinking
          </>
        )}
      </button>

      {open && reasoning && (
        <div className="border-t border-white/10 px-4 py-3 text-gray-400 prose prose-sm prose-invert max-w-none">
          <ReactMarkdown>{reasoning}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create client/src/components/chat/MessageBubble.jsx**

```jsx
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ThinkingBlock from './ThinkingBlock.jsx';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="rounded px-2 py-1 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

const components = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    if (inline) return <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm font-mono">{children}</code>;
    return (
      <div className="relative my-4 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2">
          <span className="text-xs text-gray-400">{match?.[1] || 'code'}</span>
          <CopyButton text={String(children)} />
        </div>
        <SyntaxHighlighter style={oneDark} language={match?.[1] || 'text'} PreTag="div" {...props}>
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  },
};

export default function MessageBubble({ message, isStreaming, streamingContent, streamingReasoning }) {
  const isUser      = message?.role === 'user';
  const content     = isStreaming ? streamingContent : message?.content;
  const reasoning   = isStreaming ? streamingReasoning : message?.reasoning;

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#2f2f2f] dark:bg-[#2f2f2f] px-4 py-3 text-white">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-8 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-3xl">
        <ThinkingBlock reasoning={reasoning} isStreaming={isStreaming && !content} />
        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-gray-100">
          <ReactMarkdown components={components}>{content || ''}</ReactMarkdown>
          {isStreaming && content && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-white" />
          )}
        </div>
        {!isStreaming && message && (
          <div className="mt-2 flex items-center gap-2">
            <CopyButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/chat/ThinkingBlock.jsx client/src/components/chat/MessageBubble.jsx
git commit -m "feat: ThinkingBlock (Claude-style collapsible reasoning) and MessageBubble"
```

---

## Task 18: MessageInput & EmptyState

**Files:**
- Create: `client/src/components/chat/MessageInput.jsx`, `client/src/components/chat/EmptyState.jsx`

- [ ] **Step 1: Create client/src/components/chat/MessageInput.jsx**

```jsx
import { useRef, useEffect } from 'react';
import { config } from '../../config/config.js';

export default function MessageInput({ value, onChange, onSubmit, disabled }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + 'px';
  }, [value]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  }

  const remaining = config.chat.maxMessageLength - value.length;
  const nearLimit = remaining < 200;

  return (
    <div className="border-t border-white/10 bg-[#212121] dark:bg-[#212121] px-4 pb-4 pt-3 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-3 rounded-2xl bg-[#2f2f2f] px-4 py-3">
          <textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Message DeepSeek…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder-gray-500 outline-none disabled:opacity-50"
          />
          <div className="flex flex-shrink-0 items-center gap-2">
            {nearLimit && (
              <span className={`text-xs ${remaining < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {remaining}
              </span>
            )}
            <button
              onClick={onSubmit}
              disabled={disabled || !value.trim() || remaining < 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black transition hover:bg-gray-200 disabled:opacity-30"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-gray-600">
          DeepSeek V3.2 can make mistakes. Verify important info.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create client/src/components/chat/EmptyState.jsx**

```jsx
const SUGGESTIONS = [
  'Explain quantum computing in simple terms',
  'Write a Python script to rename files in bulk',
  'What are the pros and cons of microservices?',
  'Help me debug this React useEffect',
];

export default function EmptyState({ onSelect }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white">What can I help with?</h2>
        <p className="mt-2 text-sm text-gray-400">Powered by DeepSeek V3.2 685B</p>
      </div>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-gray-300 transition hover:border-white/20 hover:bg-white/10"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/chat/
git commit -m "feat: MessageInput (auto-grow, char limit) and EmptyState"
```

---

## Task 19: UI Utility Components

**Files:**
- Create: `client/src/components/ui/ThemeToggle.jsx`, `client/src/components/ui/ModelSelector.jsx`

- [ ] **Step 1: Create client/src/components/ui/ThemeToggle.jsx**

```jsx
import { useThemeStore } from '../../store/themeStore.js';

export default function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/10 hover:text-white"
    >
      {isDark ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Create client/src/components/ui/ModelSelector.jsx**

```jsx
import { config } from '../../config/config.js';
import { useChatStore } from '../../store/chatStore.js';

export default function ModelSelector({ conversationId }) {
  const { conversations } = useChatStore();
  const conv = conversations.find(c => c._id === conversationId);
  const currentModel = conv?.model || config.models.available[0].id;

  return (
    <div className="px-3 py-2">
      <select
        value={currentModel}
        disabled
        className="w-full rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-400 outline-none"
        title="Model in use (set per conversation)"
      >
        {config.models.available.map(m => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ui/
git commit -m "feat: ThemeToggle and ModelSelector components"
```

---

## Task 20: Sidebar

**Files:**
- Create: `client/src/components/layout/Sidebar.jsx`

- [ ] **Step 1: Create client/src/components/layout/Sidebar.jsx**

```jsx
import { useState } from 'react';
import { useConversations } from '../../hooks/useConversations.js';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.jsx';
import { authApi } from '../../api/auth.js';
import ThemeToggle from '../ui/ThemeToggle.jsx';

function ConversationItem({ conv, isActive, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conv.title);

  function submitRename() {
    if (title.trim() && title !== conv.title) onRename(conv._id, title.trim());
    setEditing(false);
  }

  return (
    <div
      onClick={() => !editing && onSelect(conv._id)}
      className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition ${
        isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={submitRename}
          onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setEditing(false); }}
          onClick={e => e.stopPropagation()}
          className="flex-1 truncate bg-transparent text-sm outline-none"
        />
      ) : (
        <span className="flex-1 truncate text-sm">{conv.title}</span>
      )}

      <div className="hidden shrink-0 gap-1 group-hover:flex" onClick={e => e.stopPropagation()}>
        <button onClick={() => setEditing(true)} className="rounded p-1 hover:bg-white/10" title="Rename">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={() => onDelete(conv._id)} className="rounded p-1 hover:bg-white/10 hover:text-red-400" title="Delete">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  const { conversations, create, rename, remove } = useConversations();
  const { activeConversationId, setActiveConversation } = useChatStore();
  const { user, clearUser } = useAuthStore();

  async function newChat() {
    await create.mutateAsync({});
  }

  async function handleLogout() {
    await authApi.logout();
    clearUser();
  }

  const content = (
    <div className="flex h-full w-64 flex-col bg-[#171717] dark:bg-[#171717]">
      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={newChat}
          className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {conversations?.map(conv => (
          <ConversationItem
            key={conv._id}
            conv={conv}
            isActive={conv._id === activeConversationId}
            onSelect={(id) => { setActiveConversation(id); onClose?.(); }}
            onRename={(id, title) => rename.mutate({ id, title })}
            onDelete={(id) => remove.mutate(id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="flex-1 truncate text-sm text-gray-300">{user?.name}</span>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">{content}</div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <div className="relative z-50">{content}</div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/layout/Sidebar.jsx
git commit -m "feat: Sidebar with conversation list, rename, delete, logout, theme toggle"
```

---

## Task 21: ChatArea

**Files:**
- Create: `client/src/components/layout/ChatArea.jsx`

- [ ] **Step 1: Create client/src/components/layout/ChatArea.jsx**

```jsx
import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore.js';
import { useMessages } from '../../hooks/useMessages.js';
import { useSSE } from '../../hooks/useSSE.js';
import MessageBubble from '../chat/MessageBubble.jsx';
import MessageInput from '../chat/MessageInput.jsx';
import EmptyState from '../chat/EmptyState.jsx';

export default function ChatArea() {
  const {
    activeConversationId, messages,
    isStreaming, streamingContent, streamingReasoning,
    addUserMessage,
  } = useChatStore();

  const { isLoading } = useMessages(activeConversationId);
  const { stream } = useSSE();

  const [input, setInput]       = useState('');
  const [error, setError]       = useState('');
  const bottomRef               = useRef(null);
  const [userScrolled, setScrolled] = useState(false);

  // Auto-scroll
  useEffect(() => {
    if (!userScrolled) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, userScrolled]);

  function handleScroll(e) {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setScrolled(!atBottom);
  }

  async function handleSend() {
    const content = input.trim();
    if (!content || isStreaming || !activeConversationId) return;

    setInput('');
    setError('');
    setScrolled(false);

    addUserMessage({ _id: Date.now(), role: 'user', content, createdAt: new Date().toISOString() });

    try {
      await stream(activeConversationId, content);
    } catch (err) {
      setError(err.message || 'Failed to get response');
    }
  }

  if (!activeConversationId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#212121] dark:bg-[#212121]">
        <p className="text-gray-500 text-sm">Select or create a conversation</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[#212121] dark:bg-[#212121] overflow-hidden">
      {/* Messages */}
      <div className="relative flex-1 overflow-y-auto" onScroll={handleScroll}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <EmptyState onSelect={s => { setInput(s); }} />
        ) : (
          <div className="pb-4 pt-6">
            {messages.map(msg => (
              <MessageBubble key={msg._id} message={msg} />
            ))}

            {isStreaming && (
              <MessageBubble
                isStreaming
                streamingContent={streamingContent}
                streamingReasoning={streamingReasoning}
              />
            )}

            {error && (
              <div className="px-4 py-2 md:px-8 lg:px-16 xl:px-24">
                <div className="mx-auto max-w-3xl">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {userScrolled && (
          <button
            onClick={() => { setScrolled(false); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
            className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white shadow-lg transition hover:bg-white/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Input */}
      <MessageInput
        value={input}
        onChange={setInput}
        onSubmit={handleSend}
        disabled={isStreaming}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/layout/ChatArea.jsx
git commit -m "feat: ChatArea with streaming display, auto-scroll, scroll-to-bottom FAB"
```

---

## Task 22: ChatPage & Final Wiring

**Files:**
- Create: `client/src/pages/ChatPage.jsx`

- [ ] **Step 1: Create client/src/pages/ChatPage.jsx**

```jsx
import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar.jsx';
import ChatArea from '../components/layout/ChatArea.jsx';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full bg-[#212121] dark:bg-[#212121]">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-[#212121] px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-medium text-white">DeepSeek V3.2</span>
        </div>

        <ChatArea />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run both servers and verify end-to-end**

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Navigate to `http://localhost:5173`:
- Register → redirects to `/chat`
- New chat button creates a conversation
- Type a message → streams response with ThinkingBlock
- Theme toggle switches dark/light
- Mobile: sidebar collapses to hamburger menu

- [ ] **Step 3: Run server tests one final time**

```bash
cd server && npm test
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/ChatPage.jsx
git commit -m "feat: ChatPage layout, mobile sidebar toggle, complete integration"
```

---

## Self-Review

**Spec coverage check:**
- ✅ NVIDIA DeepSeek V3.2 via OpenAI SDK — Task 9
- ✅ JWT httpOnly cookies, refresh rotation — Task 6
- ✅ Central config (models, AI params, rate limits, auth, pagination, CORS) — Task 2
- ✅ MongoDB User, Conversation, Message models — Task 3
- ✅ helmet, cors, rate-limit, mongo-sanitize, zod validation — Tasks 4–6
- ✅ Multiple conversations with history — Tasks 8, 14
- ✅ SSE streaming with reasoning_content — Tasks 9, 14
- ✅ Claude-style ThinkingBlock (collapsible) — Task 17
- ✅ ChatGPT/Claude-style UI — Tasks 17–21
- ✅ Tailwind v4 dark/light theme, persisted — Tasks 11, 19
- ✅ Fully responsive (sidebar drawer on mobile, all breakpoints) — Tasks 20, 22
- ✅ Auto-scroll + scroll-to-bottom FAB — Task 21
- ✅ Markdown + syntax highlighting — Task 17
- ✅ Copy button on messages — Task 17
- ✅ Empty state with suggested prompts — Task 18
- ✅ Character counter on input — Task 18
- ✅ .env validation at startup, .env.example — Tasks 1–2
- ✅ Integration tests (auth, conversations) — Tasks 7–8

**No placeholders found.**

**Type consistency verified** — `conversationId`, `_id`, `role`, `content`, `reasoning`, `tokens` used consistently across models, controllers, store, and components.
