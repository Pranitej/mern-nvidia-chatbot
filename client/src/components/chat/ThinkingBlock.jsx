import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ThinkingBlock({ reasoning, isStreaming }) {
  const [open, setOpen] = useState(false);

  if (!reasoning && !isStreaming) return null;

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/3 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-white/20">
      <button
        onClick={() => setOpen(o => !o)}
        className="group relative flex w-full items-center gap-2.5 px-5 py-3 text-left transition-all duration-200 hover:bg-white/5"
      >
        {/* Animated gradient border on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:via-purple-500/5 group-hover:to-purple-500/10 transition-all duration-300" />
        
        {isStreaming && !reasoning ? (
          <span className="relative flex items-center gap-2.5">
            <span className="flex gap-1.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400 [animation-delay:300ms]" />
            </span>
            <span className="text-sm font-medium text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
              Thinking…
            </span>
          </span>
        ) : (
          <span className="relative flex items-center gap-2.5">
            <svg 
              className={`h-4 w-4 text-purple-400 transition-all duration-300 ${open ? 'rotate-90 translate-x-0.5' : 'group-hover:translate-x-0.5'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200 transition-colors duration-200">
              Thinking
            </span>
            {reasoning && (
              <span className="text-xs text-purple-400/60 group-hover:text-purple-400 transition-colors duration-200">
                {open ? 'Hide reasoning' : 'Show reasoning'}
              </span>
            )}
          </span>
        )}
      </button>

      {open && reasoning && (
        <div className="border-t border-white/10 bg-gradient-to-b from-white/5 to-transparent animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-5 py-4 text-gray-300 prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2 leading-relaxed text-sm text-gray-300 last:mb-0">
                    {children}
                  </p>
                ),
                code: ({ inline, children }) => (
                  inline ? (
                    <code className="rounded bg-purple-500/10 px-1.5 py-0.5 text-sm font-mono text-purple-300">
                      {children}
                    </code>
                  ) : (
                    <code className="block rounded-lg bg-[#1a1a1a] p-3 text-sm font-mono text-gray-300 overflow-x-auto">
                      {children}
                    </code>
                  )
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 my-2 marker:text-purple-400">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 my-2 marker:text-purple-400">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-gray-300 text-sm">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-purple-300">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-400">
                    {children}
                  </em>
                ),
              }}
            >
              {reasoning}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}