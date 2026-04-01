import { config } from '../../config/config.js';

const SUGGESTIONS = [
  'Explain quantum computing in simple terms',
  'Write a Python script to rename files in bulk',
  'What are the pros and cons of microservices?',
  'Help me debug this React useEffect',
];

export default function EmptyState({ onSelect }) {
  const modelLabel = config.models.available[0]?.label || 'DeepSeek';

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 md:py-16 lg:py-20">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          What can I help with?
        </h2>
        <p className="text-sm text-gray-400">
          Powered by <span className="font-semibold text-purple-400">{modelLabel}</span>
        </p>
      </div>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
        {SUGGESTIONS.map((s, index) => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm text-gray-300 transition-all duration-200 hover:border-purple-500/50 hover:bg-white/10 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-purple-500/5 group-hover:to-purple-500/5 transition-all duration-300" />
            <span className="relative block font-medium group-hover:text-white transition-colors duration-200">
              {s}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}