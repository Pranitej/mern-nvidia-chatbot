import { useRef, useEffect, useState, useCallback } from 'react';
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
      <div className="w-[420px] rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Choose model</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Select an AI model for this conversation</p>
          </div>
        </div>

        {/* Model list */}
        <div className="py-2 max-h-[480px] overflow-y-auto">
          {config.models.available.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onSelect(m.id); onClose(); }}
              className={`w-full flex items-start gap-3 px-5 py-3 text-left transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                m.id === selectedModelId 
                  ? 'bg-purple-50/50 dark:bg-purple-900/20 border-l-2 border-l-purple-500 dark:border-l-purple-400' 
                  : 'border-l-2 border-l-transparent'
              }`}
            >
              <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                m.id === selectedModelId 
                  ? 'bg-purple-500 dark:bg-purple-400' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{m.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{m.description}</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {m.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {tag}
                    </span>
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

export default function MessageInput({ value, onChange, onSubmit, disabled, isStreaming, onStop }) {
  const ref = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { selectedModelId, setSelectedModelId } = useChatStore();

  const activeModel = config.models.available.find(m => m.id === selectedModelId) || config.models.available[0];

  const handleModalClose = useCallback(() => setModalOpen(false), []);

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
        onClose={handleModalClose}
        selectedModelId={selectedModelId}
        onSelect={setSelectedModelId}
      />

      <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pb-6 pt-5 md:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative group">
            {/* Subtle focus glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 blur-md" />

            <div className="relative flex flex-col rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 focus-within:border-purple-300 dark:focus-within:border-purple-500">
              {/* Text area + buttons row */}
              <div className="flex items-center gap-2">
                <textarea
                  ref={ref}
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={disabled}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent px-5 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none disabled:opacity-50 transition-colors leading-6"
                />
                <div className="flex flex-shrink-0 items-center gap-2 pr-4">
                  {nearLimit && (
                    <span className={`text-xs font-mono px-2 py-1 rounded-md transition-all duration-200 ${
                      remaining < 0
                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    }`}>
                      {remaining}
                    </span>
                  )}
                  {/* Model pill button */}
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 h-9 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate max-w-[120px]">{activeModel.label}</span>
                    <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {/* Send / Stop button */}
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={onStop}
                      aria-label="Stop generating"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={onSubmit}
                      disabled={disabled || !value.trim() || remaining < 0}
                      className="group/btn flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
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
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              AI can make mistakes. Verify important info.
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
          </div>
        </div>
      </div>
    </>
  );
}