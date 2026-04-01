import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { config } from '../../config/config.js';
import remarkGfm from 'remark-gfm';
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
    <button 
      onClick={copy} 
      className="group relative rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent"
    >
      {copied ? (
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </span>
      )}
    </button>
  );
}

const components = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    if (inline) {
      return (
        <code className="rounded-md bg-purple-500/10 px-1.5 py-0.5 text-sm font-mono text-purple-300 border border-purple-500/20">
          {children}
        </code>
      );
    }
    return (
      <div className="relative my-6 rounded-xl overflow-hidden border border-white/10 shadow-lg">
        <div className="flex items-center justify-between bg-[var(--bg-code-hdr)] px-4 py-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs font-mono text-gray-400">
              {match?.[1] || 'code'}
            </span>
          </div>
          <CopyButton text={String(children)} />
        </div>
        <SyntaxHighlighter 
          style={oneDark} 
          language={match?.[1] || 'text'} 
          PreTag="div" 
          customStyle={{ margin: 0, borderRadius: 0 }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  },
  a({ href, children }) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
      >
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-purple-500 pl-4 my-4 py-2 text-[var(--text-muted)] italic bg-white/5 rounded-r-lg">
        {children}
      </blockquote>
    );
  },
  h1({ children }) {
    return <h1 className="text-2xl font-bold mt-8 mb-4 pb-2 border-b border-[var(--border)] text-[var(--text-base)]">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-xl font-bold mt-6 mb-3 text-[var(--text-base)]">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-lg font-semibold mt-4 mb-2 text-purple-300">{children}</h3>;
  },
  ul({ children }) {
    return <ul className="list-disc list-outside pl-5 space-y-1 my-3 marker:text-purple-400">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal list-outside pl-5 space-y-1 my-3 marker:text-purple-400">{children}</ol>;
  },
  li({ children }) {
    return <li className="text-[var(--text-muted)] mb-1 pl-1">{children}</li>;
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-white/10 rounded-lg overflow-hidden text-sm">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-white/5 border-b border-white/10">{children}</thead>;
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-white/10">{children}</tbody>;
  },
  tr({ children }) {
    return <tr className="hover:bg-white/5 transition-colors">{children}</tr>;
  },
  th({ children }) {
    return <th className="px-4 py-2.5 text-left text-xs font-semibold text-purple-300 uppercase tracking-wide">{children}</th>;
  },
  td({ children }) {
    return <td className="px-4 py-2.5 text-[var(--text-muted)]">{children}</td>;
  },
  p({ children }) {
    return <p className="mb-3 leading-relaxed text-[var(--text-muted)]">{children}</p>;
  },
  hr() {
    return <hr className="my-6 border-white/10" />;
  },
  strong({ children }) {
    return <strong className="font-bold text-[var(--text-base)]">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic text-[var(--text-muted)]">{children}</em>;
  },
};

// CommonMark won't recognize closing ** as valid when preceded by : (colon)
// and followed by a non-ASCII character (e.g., CJK). Insert a space to fix.
function preprocessMarkdown(text) {
  if (!text) return text;
  return text.replace(/:(\*{1,2})([^\s\x00-\x7F])/g, ':$1 $2');
}

export default function MessageBubble({ message, isStreaming, streamingContent, streamingReasoning, model }) {
  const isUser = message?.role === 'user';
  const rawContent = isStreaming ? streamingContent : message?.content;
  const content = isUser ? rawContent : preprocessMarkdown(rawContent);
  const reasoning = isStreaming ? streamingReasoning : message?.reasoning;

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-3 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="group relative max-w-[85%] md:max-w-[75%] lg:max-w-[65%]">
          <div className="rounded-2xl rounded-tr-md bg-gradient-to-br from-purple-600 to-blue-600 px-5 py-3 shadow-lg">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">
              {content}
            </p>
          </div>
          <div className="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="p-1 rounded-full bg-gray-800 border border-white/10">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group px-4 py-4 md:px-8 lg:px-16 xl:px-24 transition-all duration-300">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text">
            Assistant
          </span>
          {model && (() => {
            const m = config.models.available.find(x => x.id === model);
            return (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400">
                <span className="w-1 h-1 rounded-full bg-purple-400 inline-block" />
                {m?.label ?? model.split('/').pop()}
              </span>
            );
          })()}
        </div>
        
        <ThinkingBlock reasoning={reasoning} isStreaming={isStreaming && !content} />
        
        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-[var(--text-muted)]">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content || ''}</ReactMarkdown>
          {isStreaming && content && (
            <span className="inline-block ml-0.5 h-4 w-0.5 animate-pulse bg-purple-400 rounded-full" />
          )}
        </div>
        
        {!isStreaming && message && (
          <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <CopyButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}