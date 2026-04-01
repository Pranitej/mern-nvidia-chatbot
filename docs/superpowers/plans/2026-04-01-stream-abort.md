# Stream Abort (Interrupt) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user cancel an in-progress AI streaming response by clicking a stop button, discarding the partial content and re-enabling the input immediately.

**Architecture:** Client adds an `AbortController` to the `fetch` call in `useSSE.js` and exposes an `abort()` function. `ChatArea.jsx` shows a stop button while streaming that calls `abort()`. The server listens for `req.on('close')` and skips saving the assistant message if the client disconnected mid-stream.

**Tech Stack:** React 19, Zustand, Fetch API (AbortController), Express.js (Node.js req close event)

---

## Files

| File | Change |
|------|--------|
| `client/src/hooks/useSSE.js` | Add `AbortController`, `abortControllerRef`, handle `AbortError`, expose `abort` |
| `server/controllers/aiController.js` | Add `aborted` flag, `req.on('close')` listener, guard all SSE callbacks |
| `client/src/components/layout/ChatArea.jsx` | Destructure `abort`, add stop button, remove `disabled={isStreaming}` from `MessageInput` |

---

## Task 1: Add AbortController to useSSE.js

**Files:**
- Modify: `client/src/hooks/useSSE.js`

- [ ] **Step 1: Replace the entire file content**

```js
import { useCallback, useRef } from 'react';
import { useChatStore } from '../store/chatStore.js';

export function useSSE() {
  const { startStreaming, appendToken, appendReasoning, finalizeStream, clearStream } = useChatStore();
  const abortControllerRef = useRef(null);

  const stream = useCallback(async (conversationId, content, model) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    startStreaming();

    try {
      const res = await fetch(`/api/ai/stream/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, model }),
        signal: controller.signal,
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
          let event;
          try { event = JSON.parse(line.slice(6)); } catch (_) { continue; }
          if (event.type === 'token')     appendToken(event.content);
          if (event.type === 'reasoning') appendReasoning(event.content);
          if (event.type === 'done')      finalizeStream(event.messageId, event.tokens, event.model);
          if (event.type === 'error')     throw new Error(event.message);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        clearStream();
        return;
      }
      clearStream();
      throw err;
    }
  }, [startStreaming, appendToken, appendReasoning, finalizeStream, clearStream]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { stream, abort };
}
```

- [ ] **Step 2: Verify build**

```bash
cd "d:/Study/MERN/Chatbot/client" && npm run build
```

Expected: No errors. `useSSE` now exports `{ stream, abort }`.

- [ ] **Step 3: Commit**

```bash
cd "d:/Study/MERN/Chatbot" && git add client/src/hooks/useSSE.js && git commit -m "feat: add AbortController to useSSE for stream cancellation"
```

---

## Task 2: Add req.close handler to aiController.js

**Files:**
- Modify: `server/controllers/aiController.js`

- [ ] **Step 1: Replace the entire file content**

```js
import { z } from 'zod';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { streamChat } from '../services/nvidiaService.js';
import { config } from '../config/config.js';
import { logger } from '../config/logger.js';

const validModelIds = new Set(config.models.available.map(m => m.id));

const streamSchema = z.object({
  content: z.string().min(1).max(config.chat?.maxMessageLength ?? 4000),
  model:   z.string().optional(),
});

export async function streamMessage(req, res, next) {
  const convId = req.params.conversationId;
  try {
    const { content, model: requestModel } = streamSchema.parse(req.body);
    logger.info({ convId, contentLength: content.length }, 'stream:request');

    const conversation = await Conversation.findOne({
      _id: convId,
      userId: req.user.id,
    });
    if (!conversation) {
      logger.warn({ convId, userId: req.user.id }, 'stream:conversation_not_found');
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Save user message
    await Message.create({ conversationId: conversation._id, role: 'user', content });

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
    const modelId = (requestModel && validModelIds.has(requestModel))
      ? requestModel
      : conversation.model;
    logger.debug({ convId, model: modelId, historyLength: messages.length }, 'stream:calling_nvidia');

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    // Track client disconnect
    let aborted = false;
    req.on('close', () => {
      aborted = true;
      logger.info({ convId }, 'stream:client_aborted');
    });

    // Idle timeout — resets on every chunk so long responses aren't killed
    let timeout;
    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        logger.error({ convId }, 'stream:timeout');
        send({ type: 'error', message: 'Stream timeout' });
        res.end();
      }, config.ai.streamTimeout);
    };
    resetTimeout();

    await streamChat({
      messages,
      model: modelId,
      onToken: (token) => {
        if (aborted) return;
        resetTimeout();
        send({ type: 'token', content: token });
      },
      onReasoning: (chunk) => {
        if (aborted) return;
        resetTimeout();
        send({ type: 'reasoning', content: chunk });
      },
      onDone: async ({ content: fullContent, reasoning, tokens }) => {
        clearTimeout(timeout);
        if (aborted) {
          logger.info({ convId }, 'stream:aborted_before_save');
          res.end();
          return;
        }
        logger.info({ convId, tokens, hasReasoning: !!reasoning, contentLength: fullContent.length }, 'stream:done');
        const msg = await Message.create({
          conversationId: conversation._id,
          role: 'assistant',
          content: fullContent,
          reasoning,
          tokens,
        });
        send({ type: 'done', messageId: msg._id, tokens, model: modelId });
        res.end();
      },
      onError: (err) => {
        clearTimeout(timeout);
        logger.error({ convId, err: err.message, status: err.status }, 'stream:error');
        send({ type: 'error', message: err.message || 'Stream error' });
        res.end();
      },
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    logger.error({ convId, err: err.message }, 'stream:unexpected_error');
    next(err);
  }
}
```

- [ ] **Step 2: Verify server starts**

```bash
cd "d:/Study/MERN/Chatbot/server" && node --check app.js
```

Expected: No syntax errors printed.

- [ ] **Step 3: Commit**

```bash
cd "d:/Study/MERN/Chatbot" && git add server/controllers/aiController.js && git commit -m "feat: detect client abort in stream controller, skip saving partial response"
```

---

## Task 3: Add stop button to ChatArea.jsx

**Files:**
- Modify: `client/src/components/layout/ChatArea.jsx`

- [ ] **Step 1: Update useSSE destructuring (line 18)**

Change:
```jsx
const { stream } = useSSE();
```
To:
```jsx
const { stream, abort } = useSSE();
```

- [ ] **Step 2: Remove disabled={isStreaming} from MessageInput (line 172)**

Change:
```jsx
<MessageInput
  value={input}
  onChange={setInput}
  onSubmit={handleSend}
  disabled={isStreaming}
/>
```
To:
```jsx
<MessageInput
  value={input}
  onChange={setInput}
  onSubmit={handleSend}
  disabled={false}
/>
```

- [ ] **Step 3: Add stop button above MessageInput**

The input area section currently looks like (lines 166-174):
```jsx
{/* Input Area with decorative gradient */}
<div className="relative">
  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
  <MessageInput
    value={input}
    onChange={setInput}
    onSubmit={handleSend}
    disabled={false}
  />
</div>
```

Replace that entire block with:
```jsx
{/* Input Area with decorative gradient */}
<div className="relative">
  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
  {isStreaming && (
    <div className="flex justify-center pb-2 pt-1">
      <button
        onClick={abort}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-semibold shadow-lg hover:scale-105 hover:shadow-red-500/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
        Stop generating
      </button>
    </div>
  )}
  <MessageInput
    value={input}
    onChange={setInput}
    onSubmit={handleSend}
    disabled={false}
  />
</div>
```

- [ ] **Step 4: Verify build**

```bash
cd "d:/Study/MERN/Chatbot/client" && npm run build
```

Expected: No errors.

- [ ] **Step 5: Manual verification**

Start the dev servers and send a message. While the bot is responding:
- A red "Stop generating" button appears above the input
- Clicking it stops the stream immediately, clears the partial response, re-enables input
- No error message shown to the user
- The next message can be typed and sent normally
- The stopped partial response does NOT appear in conversation history after refresh

- [ ] **Step 6: Commit**

```bash
cd "d:/Study/MERN/Chatbot" && git add client/src/components/layout/ChatArea.jsx && git commit -m "feat: add stop button to cancel streaming response"
```
