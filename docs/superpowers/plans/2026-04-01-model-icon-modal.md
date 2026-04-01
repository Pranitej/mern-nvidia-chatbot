# Model Icon + Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline model dropdown in the message input with a pill icon button that opens a centered modal, and make the header "Active Model" badge reactive to the selected model.

**Architecture:** Two self-contained changes — (1) rewrite the `ModelPicker` inline component in `MessageInput.jsx` as a `ModelModal` + pill button, (2) wire `ChatPage.jsx`'s `modelLabel` to `useChatStore` instead of a static config lookup.

**Tech Stack:** React 19, Zustand, Tailwind CSS v4, Vite

---

## Files

| File | Change |
|------|--------|
| `client/src/components/chat/MessageInput.jsx` | Remove `ModelPicker` + its bottom row; add `ModelModal` component + pill trigger button |
| `client/src/pages/ChatPage.jsx` | Replace static `modelLabel` with reactive store lookup |

---

## Task 1: Replace ModelPicker with ModelModal + pill button in MessageInput.jsx

**Files:**
- Modify: `client/src/components/chat/MessageInput.jsx`

- [ ] **Step 1: Replace the entire file content**

Open `client/src/components/chat/MessageInput.jsx` and replace with:

```jsx
import { useRef, useEffect, useState } from 'react';
import { config } from '../../config/config.js';
import { useChatStore } from '../../store/chatStore.js';

function ModelModal({ open, onClose, selectedModelId, onSelect }) {
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-80 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-semibold text-[var(--text-base)]">Select Model</span>
        </div>

        {/* Model list */}
        <div className="py-1">
          {config.models.available.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onSelect(m.id); onClose(); }}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors duration-100 ${m.id === selectedModelId ? 'bg-purple-500/10' : ''}`}
            >
              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${m.id === selectedModelId ? 'bg-purple-400' : 'border border-gray-600'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-base)]">{m.label}</p>
                <p className="text-xs text-[var(--text-dim)] mt-0.5 leading-tight">{m.description}</p>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {m.tags.map(tag => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MessageInput({ value, onChange, onSubmit, disabled }) {
  const ref = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { selectedModelId, setSelectedModelId } = useChatStore();

  const activeModel = config.models.available.find(m => m.id === selectedModelId) || config.models.available[0];

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
    <>
      <ModelModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedModelId={selectedModelId}
        onSelect={setSelectedModelId}
      />

      <div className="border-t border-[var(--border)] bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-base)] px-4 pb-6 pt-4 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="relative group">
            {/* Animated glow effect on focus */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-focus-within:opacity-20 transition-opacity duration-300 blur-md" />

            <div className="relative flex flex-col rounded-2xl bg-[var(--bg-input)] border border-[var(--border)] shadow-lg transition-all duration-200 focus-within:border-purple-500/50 focus-within:shadow-purple-500/10">
              {/* Text area + buttons row */}
              <div className="flex items-end gap-3">
                <textarea
                  ref={ref}
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={disabled}
                  placeholder="Message the AI…"
                  rows={1}
                  className="flex-1 resize-none bg-transparent px-4 pt-3 pb-3 text-sm text-[var(--text-base)] placeholder-gray-500 outline-none disabled:opacity-50 transition-colors"
                />
                <div className="flex flex-shrink-0 items-center gap-2 pr-3 pb-3">
                  {nearLimit && (
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded-md transition-all duration-200 ${
                      remaining < 0
                        ? 'text-red-400 bg-red-400/10 animate-pulse'
                        : 'text-yellow-400 bg-yellow-400/10'
                    }`}>
                      {remaining}
                    </span>
                  )}
                  {/* Model pill button */}
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-semibold hover:bg-purple-500/25 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate max-w-[100px]">{activeModel.label}</span>
                  </button>
                  {/* Send button */}
                  <button
                    onClick={onSubmit}
                    disabled={disabled || !value.trim() || remaining < 0}
                    className="group/btn relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
                  >
                    <svg
                      className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <p className="text-center text-xs text-gray-500 transition-colors hover:text-gray-400">
              AI can make mistakes. Verify important info.
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify the dev server compiles without errors**

```bash
cd client && npm run dev
```

Expected: Vite compiles successfully, no errors in terminal. Open the app in browser — the message input should show the pill button (e.g. `DeepSeek V3.1`) next to the send button. The old dropdown row at the bottom should be gone.

- [ ] **Step 3: Verify modal opens and closes**

In the browser:
- Click the pill button → modal appears centered with a dark backdrop
- Click a different model → modal closes, pill label updates to the new model
- Press `Escape` → modal closes
- Click the backdrop (outside the modal panel) → modal closes

- [ ] **Step 4: Commit**

```bash
git add client/src/components/chat/MessageInput.jsx
git commit -m "feat: replace model dropdown with pill button + modal in message input"
```

---

## Task 2: Make header Active Model badge reactive in ChatPage.jsx

**Files:**
- Modify: `client/src/pages/ChatPage.jsx`

- [ ] **Step 1: Update the import and modelLabel derivation**

In `client/src/pages/ChatPage.jsx`, make these two changes:

1. Add the store import after the existing imports:
```jsx
import { useChatStore } from '../store/chatStore.js';
```

2. Replace the static `modelLabel` line inside the component:
```jsx
// Remove this:
const modelLabel = config.models.available[0]?.label || 'DeepSeek';

// Replace with:
const { selectedModelId } = useChatStore();
const modelLabel = config.models.available.find(m => m.id === selectedModelId)?.label
  ?? config.models.available[0]?.label;
```

- [ ] **Step 2: Verify the badge updates reactively**

In the browser:
- The desktop badge (top-right) and mobile header badge should both show the current model label
- Open the modal via the pill button, select a different model — both badges update immediately without page refresh

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/ChatPage.jsx
git commit -m "feat: make active model header badge reactive to store selection"
```
