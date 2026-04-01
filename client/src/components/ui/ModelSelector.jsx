import { config } from '../../config/config.js';
import { useChatStore } from '../../store/chatStore.js';

export default function ModelSelector({ conversationId }) {
  const { conversations } = useChatStore();
  const conv = conversations.find(c => c._id === conversationId);
  const currentModel = conv?.model || config.models.available[0].id;
  
  // Find current model label
  const currentModelLabel = config.models.available.find(m => m.id === currentModel)?.label || 'Model';

  return (
    <div className="relative group px-3 py-2">
      <div className="relative">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Select container */}
        <div className="relative flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 transition-all duration-200 group-hover:bg-white/10 group-hover:border-purple-500/30">
          {/* Model icon */}
          <div className="flex-shrink-0">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          {/* Model info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400">Model</span>
              <div className="h-3 w-px bg-white/20" />
              <span className="text-xs font-semibold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                {currentModelLabel}
              </span>
            </div>
          </div>
          
          {/* Lock icon (since disabled) */}
          <div className="flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          {/* Hidden select (kept for functionality) */}
          <select
            value={currentModel}
            disabled
            className="absolute inset-0 w-full h-full opacity-0 cursor-not-allowed"
            title="Model is set per conversation and cannot be changed"
          >
            {config.models.available.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-gray-300 shadow-lg">
          Model is locked per conversation
        </div>
      </div>
    </div>
  );
}