'use client';

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

export default function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  return (
    <div className="md:hidden bg-[#f8f9fa] dark:bg-[#1a1a1a] border-b border-[#e8eaed] dark:border-[#2d2d2d] h-14 flex items-center justify-between px-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-[#1a73e8] rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span className="text-lg font-semibold text-[#202124] dark:text-[#e8eaed]">Cognito</span>
      </div>

      {/* Hamburger Menu Button */}
      <button
        onClick={onMenuToggle}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2d2d] hover:text-[#202124] dark:hover:text-[#e8eaed] transition-all duration-200"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}