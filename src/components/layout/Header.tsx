import { resetOnboarding } from '@/components/ui/OnboardingTutorial'

export function Header() {
  function handleHelp() {
    resetOnboarding()
    window.location.reload()
  }

  return (
    <header className="flex items-center gap-4 px-5 py-2.5 border-b border-border bg-white shrink-0 z-50">
      <div className="flex items-center gap-2.5 flex-1">
        <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
          <rect x="1" y="1" width="26" height="26" rx="5" fill="#003087" opacity="0.12" />
          {/* Snake body forming an O */}
          <path d="M14 4.5C9.5 4.5 5.5 8 5.5 13C5.5 18 9.5 22 14 22C18.5 22 22.5 18 22.5 13C22.5 9.5 20 6.5 17.5 5.2"
            stroke="#003087" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {/* Snake head */}
          <ellipse cx="17.5" cy="5.2" rx="2" ry="1.4" fill="#003087" transform="rotate(-20 17.5 5.2)" />
          {/* Eye */}
          <circle cx="18.2" cy="4.7" r="0.55" fill="white" />
          {/* Tongue */}
          <path d="M19.3 5L20.2 4.5M19.3 5L20.2 5.5" stroke="#D65B5B" strokeWidth="0.5" strokeLinecap="round" />
        </svg>
        <span className="text-lg font-bold gradient-text">Ophi</span>
        <span className="text-[10px] bg-duke-50 text-duke font-semibold px-2 py-0.5 rounded-full">
          Python &rarr; Alteryx
        </span>
      </div>
      <button
        onClick={handleHelp}
        title="Show tutorial"
        className="w-7 h-7 rounded-full border border-border text-text-muted hover:text-duke hover:border-duke flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
      >
        ?
      </button>
    </header>
  )
}
