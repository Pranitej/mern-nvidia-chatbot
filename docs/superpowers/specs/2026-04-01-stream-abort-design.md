# Stream Abort (Interrupt) — Design Spec

**Date:** 2026-04-01  
**Status:** Approved

## Overview

Allow the user to cancel an in-progress AI streaming response. The client aborts the fetch connection; the server detects the close event and stops writing tokens. Partial content is discarded. The user can immediately type a new message.

---

## 1. useSSE.js — AbortController + abort function

**File:** `client/src/hooks/useSSE.js`

### What changes
- Create an `AbortController` at the start of each `stream()` call
- Store it in a `ref` (`abortControllerRef`) so `abort()` can access the current controller
- Pass `signal: abortControllerRef.current.signal` to `fetch`
- In the `catch` block, detect `AbortError` (`err.name === 'AbortError'`) — call `clearStream()` and return silently (do not re-throw)
- Expose `abort` function: calls `abortControllerRef.current?.abort()`
- Return `{ stream, abort }` from the hook

### Behaviour on abort
- `fetch` reader throws `AbortError`
- `clearStream()` sets `isStreaming: false`, clears `streamingContent` / `streamingReasoning`
- Input re-enables immediately
- No error shown to user

---

## 2. aiController.js — req.close detection

**File:** `server/controllers/aiController.js`

### What changes
Add an `aborted` flag and a `req.on('close')` listener before calling `streamChat`:

```js
let aborted = false;
req.on('close', () => { aborted = true; });
```

In each SSE callback:
- `onToken`: check `if (aborted) return` before `send()`
- `onReasoning`: check `if (aborted) return` before `send()`
- `onDone`: check `if (aborted) return` before saving the assistant message and calling `res.end()` — if aborted, skip the `Message.create()` and just `res.end()`
- `onError`: unchanged (errors still propagate normally)

### Why skip saving on abort
The user explicitly cancelled — the partial response should not appear in history. The user message was already saved before streaming began, which is correct (the user did send that message).

---

## 3. ChatArea.jsx — Stop button

**File:** `client/src/components/layout/ChatArea.jsx`

### What changes
- Destructure `abort` from `useSSE()`: `const { stream, abort } = useSSE();`
- Add a stop button **above** the `MessageInput`, visible only when `isStreaming`:

```jsx
{isStreaming && (
  <button onClick={abort} ...>
    {/* square stop icon */}
  </button>
)}
```

- Position: centered above the input area, inside the existing `<div className="relative">` wrapper
- Style: red gradient (`from-red-600 to-rose-600`), same `h-9 w-9 rounded-xl` as send button, with a filled square stop icon
- `MessageInput` is no longer passed `disabled={isStreaming}` — it remains always-enabled so the user can type their next message while the stop button is visible

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/hooks/useSSE.js` | Add `AbortController`, expose `abort`, handle `AbortError` silently |
| `server/controllers/aiController.js` | Add `req.on('close')` handler, check `aborted` in all SSE callbacks |
| `client/src/components/layout/ChatArea.jsx` | Destructure `abort`, add stop button, remove `disabled={isStreaming}` from `MessageInput` |

No new files. No store changes. No schema changes.
