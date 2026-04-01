import { useThemeStore } from '../../store/themeStore.js';

export default function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all duration-300 hover:bg-white/10 hover:text-[var(--text-base)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-sidebar)]"
    >
      {/* Ripple effect background */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      
      {/* Animated icons */}
      <div className="relative">
        {isDark ? (
          <svg 
            className="h-4 w-4 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg 
            className="h-4 w-4 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900/95 backdrop-blur-sm px-2.5 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-lg border border-white/10">
        {isDark ? 'Light mode' : 'Dark mode'}
      </div>
      
      {/* Active state indicator (optional) */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full transition-all duration-300 ${isDark ? 'bg-purple-500 opacity-100' : 'bg-purple-500/0 opacity-0'}`} />
    </button>
  );
}