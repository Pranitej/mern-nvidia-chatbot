import { useState } from 'react';
import { useConversations } from '../../hooks/useConversations.js';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { authApi } from '../../api/auth.js';
import ThemeToggle from '../ui/ThemeToggle.jsx';

function ConversationItem({ conv, isActive, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conv.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function submitRename() {
    if (title.trim() && title !== conv.title) onRename(conv._id, title.trim());
    setEditing(false);
  }

  function handleDelete() {
    if (showDeleteConfirm) {
      onDelete(conv._id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  }

  return (
    <div
      onClick={() => !editing && onSelect(conv._id)}
      className={`group relative flex cursor-pointer items-center gap-2 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white shadow-sm' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
      )}
      
      <div className="flex-1 min-w-0 px-3 py-2">
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={submitRename}
            onKeyDown={e => { 
              if (e.key === 'Enter') submitRename(); 
              if (e.key === 'Escape') setEditing(false); 
            }}
            onClick={e => e.stopPropagation()}
            className="w-full truncate bg-transparent text-sm outline-none focus:ring-1 focus:ring-purple-500 rounded px-1"
          />
        ) : (
          <span className="block truncate text-sm font-medium">
            {conv.title}
          </span>
        )}
      </div>

      <div className="hidden shrink-0 gap-0.5 pr-2 group-hover:flex" onClick={e => e.stopPropagation()}>
        <button 
          onClick={() => setEditing(true)} 
          className="rounded-md p-1.5 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-110"
          title="Rename"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button 
          onClick={handleDelete} 
          className={`rounded-md p-1.5 transition-all duration-200 hover:scale-110 ${
            showDeleteConfirm 
              ? 'bg-red-500/20 text-red-400' 
              : 'text-gray-400 hover:bg-red-500/10 hover:text-red-400'
          }`}
          title={showDeleteConfirm ? "Click again to confirm" : "Delete"}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      {/* Delete confirmation tooltip */}
      {showDeleteConfirm && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-red-500/90 px-2 py-1 text-xs text-white shadow-lg animate-in fade-in slide-in-from-right-2">
          Click again to delete
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ open, onClose, onOpenProfile }) {
  const { create, rename, remove } = useConversations();
  const { conversations, activeConversationId, setActiveConversation } = useChatStore();
  const { user, clearUser } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);

  async function newChat() {
    setIsCreating(true);
    try {
      await create.mutateAsync({});
    } finally {
      setIsCreating(false);
    }
  }

  async function handleLogout() {
    await authApi.logout();
    clearUser();
  }

  const content = (
    <div className="flex h-full w-72 flex-col bg-gradient-to-b from-[var(--bg-sidebar)] to-[var(--bg-sidebar-end)] shadow-2xl">
      {/* Header with New Chat */}
      <div className="border-b border-white/10 p-4">
        <button
          onClick={newChat}
          disabled={isCreating}
          className="group relative flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-sidebar)]"
        >
          <svg className={`h-5 w-5 transition-transform duration-200 group-hover:rotate-90 ${isCreating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isCreating ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            )}
          </svg>
          <span>{isCreating ? 'Creating...' : 'New chat'}</span>
          
          {/* Shine effect on hover */}
          <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {conversations?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
            <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-600 mt-1">Click "New chat" to start</p>
          </div>
        ) : (
          conversations?.map(conv => (
            <ConversationItem
              key={conv._id}
              conv={conv}
              isActive={conv._id === activeConversationId}
              onSelect={(id) => { setActiveConversation(id); onClose?.(); }}
              onRename={(id, title) => rename.mutate({ id, title })}
              onDelete={(id) => remove.mutate(id)}
            />
          ))
        )}
      </div>

      {/* Footer with User Profile */}
      <div className="border-t border-[var(--border)] bg-white/5 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2">
          {/* Clickable avatar + name + email → opens profile */}
          <button
            onClick={onOpenProfile}
            className="group flex flex-1 min-w-0 items-center gap-3 rounded-xl px-2 py-1.5 -mx-2 transition-all duration-200 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <div className="relative flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-sm font-semibold text-white shadow-lg">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-300" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-sm font-medium text-[var(--text-base)]">
                {user?.name || 'User'}
              </p>
              <p className="truncate text-xs text-gray-500">
                {user?.email || 'Signed in'}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1 flex-shrink-0">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              title="Logout"
              className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                Sign out
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">{content}</div>

      {/* Mobile overlay with animation */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={onClose} 
          />
          <div className="relative z-50 h-full w-72 animate-in slide-in-from-left duration-300">
            {content}
          </div>
        </div>
      )}
    </>
  );
}