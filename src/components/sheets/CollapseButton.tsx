'use client';

interface CollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export default function CollapseButton({ isCollapsed, onToggle, className = '' }: CollapseButtonProps) {
  return (
    <div className={`absolute top-0 right-0 h-full pointer-events-none ${className}`}>
      <div className="relative h-full">
        <button
          onClick={onToggle}
          className={`
            absolute top-1/2 -translate-y-1/2 z-20 pointer-events-auto
            w-6 h-16 bg-white border border-gray-200 rounded-l-md
            flex items-center justify-center
            hover:bg-gray-50 hover:border-gray-300
            transition-all duration-300 ease-in-out
            shadow-sm hover:shadow-md
            group
            ${isCollapsed ? '-right-0' : '-right-6'}
          `}
          title={isCollapsed ? 'Expandir painel' : 'Colapsar painel'}
        >
          <svg 
            className={`
              w-3 h-3 text-gray-400 group-hover:text-gray-600
              transition-transform duration-300 ease-in-out
              ${isCollapsed ? 'rotate-0' : 'rotate-180'}
            `}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
}