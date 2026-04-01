import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
    addUserMessage, selectedModelId,
  } = useChatStore();

  const { isLoading } = useMessages(activeConversationId);
  const { stream, abort } = useSSE();
  const qc = useQueryClient();

  const [input, setInput]       = useState('');
  const [error, setError]       = useState('');
  const bottomRef               = useRef(null);
  const messagesContainerRef    = useRef(null);
  const [userScrolled, setScrolled] = useState(false);

  // Auto-scroll — use instant scroll so streaming tokens don't stutter
  useEffect(() => {
    if (!userScrolled) {
      const el = messagesContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, streamingContent, userScrolled]);

  function handleScroll(e) {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setScrolled(!atBottom);
  }

  async function handleSend() {
    const content = input.trim();
    if (!content || !activeConversationId) return;
    if (isStreaming) abort();

    setInput('');
    setError('');
    setScrolled(false);

    addUserMessage({ _id: Date.now(), role: 'user', content, createdAt: new Date().toISOString() });

    try {
      await stream(activeConversationId, content, selectedModelId);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err) {
      setError(err.message || 'Failed to get response');
    }
  }

  if (!activeConversationId) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-base)]">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        </div>
        
        <div className="relative text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 backdrop-blur-sm">
            <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm font-medium">Select or create a conversation</p>
          <p className="text-gray-600 text-xs mt-2">Choose an existing chat or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-base)] overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="relative flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="relative">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-purple-500/20 border-t-purple-500" />
              <div className="absolute inset-0 h-8 w-8 animate-pulse rounded-full bg-purple-500/20 blur-md" />
            </div>
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <div className="animate-in fade-in duration-500">
            <EmptyState onSelect={s => { setInput(s); }} />
          </div>
        ) : (
          <div className="pb-6 pt-8">
            {messages.map((msg, index) => (
              <div 
                key={msg._id} 
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MessageBubble message={msg} model={msg.model} />
              </div>
            ))}

            {isStreaming && (
              <div className="animate-in fade-in duration-300">
                <MessageBubble
                  isStreaming
                  streamingContent={streamingContent}
                  streamingReasoning={streamingReasoning}
                  model={selectedModelId}
                />
              </div>
            )}

            {error && (
              <div className="px-4 py-2 md:px-8 lg:px-16 xl:px-24 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="mx-auto max-w-3xl">
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* Scroll to bottom button */}
        {userScrolled && (
          <button
            onClick={() => { 
              setScrolled(false); 
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
            }}
            className="group fixed bottom-24 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#212121] animate-in fade-in slide-in-from-bottom-2 duration-300"
            aria-label="Scroll to bottom"
          >
            <svg 
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7-7-7m14-5l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Input Area with decorative gradient */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        {isStreaming && (
          <div className="flex justify-center pb-2 pt-1">
            <button
              onClick={abort}
              aria-label="Stop generating"
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
        />
      </div>
    </div>
  );
}
