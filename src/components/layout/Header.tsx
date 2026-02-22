import { resetOnboarding } from '@/components/ui/OnboardingTutorial'

export function Header() {
  function handleHelp() {
    resetOnboarding()
    window.location.reload()
  }

  return (
    <header className="flex items-center gap-4 px-5 py-2.5 border-b border-border bg-white shrink-0 z-50">
      <div className="flex items-center gap-2.5 flex-1">
        <img src="/ophi-logo-80-retina.png" alt="Ophi" className="w-7 h-7" />
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
