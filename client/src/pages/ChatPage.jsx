import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar.jsx';
import ChatArea from '../components/layout/ChatArea.jsx';
import { config } from '../config/config.js';
import ProfileModal from './ProfileModal.jsx';
import { useChatStore } from '../store/chatStore.js';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { selectedModelId } = useChatStore();
  const modelLabel = config.models.available.find(m => m.id === selectedModelId)?.label
    ?? config.models.available[0]?.label;

  // Optional: Close sidebar on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-base)] overflow-hidden">
      {/* Sidebar with animation support */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpenProfile={() => setProfileOpen(true)} />

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Mobile Header - Enhanced */}
        <div className="lg:hidden sticky top-0 z-10">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-[var(--bg-surface)] border-b border-[var(--border)] backdrop-blur-sm" />
          
          <div className="relative flex items-center justify-between px-4 py-3">
            {/* Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
              aria-label="Open sidebar"
            >
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              
              <svg 
                className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Model Badge */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-center w-5 h-5">
                  <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                  {modelLabel}
                </span>
              </div>
            </div>
            
            {/* Placeholder for balance */}
            <div className="w-10" />
          </div>
        </div>

        {/* Desktop Header - Model Indicator */}
        <div className="hidden lg:block absolute top-4 right-6 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-center w-5 h-5">
              <svg className="w-3.5 h-3.5 text-purple-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-400">
              Active Model:
            </span>
            <span className="text-xs font-semibold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
              {modelLabel}
            </span>
          </div>
        </div>

        {/* Chat Area */}
        <ChatArea />
      </div>
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  );
}
