export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm gap-4 px-10 text-center">
      <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14 opacity-30">
        <rect x="4" y="4" width="22" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
        <rect x="30" y="30" width="22" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M26 15h4l6 6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="max-w-xs leading-relaxed">
        <strong className="text-text-primary">Paste Python code</strong> on the left or load a sample, then click <strong className="text-text-primary">Translate</strong> to see it as an Alteryx workflow.
      </p>
    </div>
  )
}
