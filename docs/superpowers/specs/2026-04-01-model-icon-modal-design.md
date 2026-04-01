# Model Icon + Modal — Design Spec

**Date:** 2026-04-01  
**Status:** Approved

## Overview

Replace the inline `ModelPicker` dropdown in the message input with a pill icon button. Clicking the pill opens a centered modal for model selection. The active model badge in the chat header becomes reactive to the store selection.

---

## 1. Message Input — Pill Button

**File:** `client/src/components/chat/MessageInput.jsx`

### What changes
- Remove the `ModelPicker` component and its bottom row (`<div className="flex items-center px-3 pb-2.5">`) entirely.
- Add a pill button in the right-side button row, positioned between the char counter and the send button.

### Pill button spec
- Icon: monitor/CPU SVG (same as used in the header badge)
- Label: truncated active model label (e.g. `DeepSeek V3.1`), max-width capped so it doesn't push the send button off
- Style: `bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-semibold rounded-lg px-2.5 h-9 flex items-center gap-1.5`
- On click: opens the model modal (`setModalOpen(true)`)

---

## 2. Model Selection Modal

**File:** `client/src/components/chat/MessageInput.jsx` (inline component, same file)

### Component: `ModelModal`
Props: `{ open, onClose, selectedModelId, onSelect }`

### Behavior
- Renders only when `open === true`
- Backdrop: fixed full-screen dark scrim (`bg-black/50 backdrop-blur-sm`), click closes modal
- Modal panel: centered, `w-80`, rounded-xl, `bg-[var(--bg-panel)] border border-[var(--border)] shadow-2xl`
- Closes on backdrop click or `Escape` key (useEffect listener)

### Modal content
- Header row: monitor icon + "Select Model" title
- One row per model from `config.models.available`:
  - Active dot (filled purple if selected, empty border if not)
  - Model name (`text-sm font-semibold`)
  - Description (`text-xs text-[var(--text-dim)]`)
  - Tags (same pill style as existing tags in the old picker)
  - Active row: `bg-purple-500/10`
  - Hover: `hover:bg-white/5`
- On model click: call `onSelect(model.id)`, call `onClose()`

### State
- `modalOpen` local state in `MessageInput` (`useState(false)`)

---

## 3. Header Badge — Reactive Active Model

**File:** `client/src/pages/ChatPage.jsx`

### What changes
- Remove: `const modelLabel = config.models.available[0]?.label || 'DeepSeek';`
- Add: 
  ```js
  import { useChatStore } from '../store/chatStore.js';
  // inside component:
  const { selectedModelId } = useChatStore();
  const modelLabel = config.models.available.find(m => m.id === selectedModelId)?.label
    ?? config.models.available[0]?.label;
  ```
- Both the desktop badge and mobile header badge already use `{modelLabel}` — no further JSX changes needed.

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/chat/MessageInput.jsx` | Remove `ModelPicker` + bottom row; add pill button + `ModelModal` component |
| `client/src/pages/ChatPage.jsx` | Make `modelLabel` reactive via `useChatStore` |

No new files. No store changes. No server changes.
