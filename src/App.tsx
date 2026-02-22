import { TranslatorProvider, useTranslator, useTranslatorDispatch } from '@/context/TranslatorContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CodeInputPanel } from '@/components/code-input/CodeInputPanel'
import { OutputPanel } from '@/components/views/OutputPanel'
import { Toast, showToast } from '@/components/ui/Toast'
import { OnboardingTutorial } from '@/components/ui/OnboardingTutorial'
import { parseCode } from '@/lib/parser'

function Divider() {
  const state = useTranslator()
  const dispatch = useTranslatorDispatch()

  const canTranslate = state.code.trim().length > 0 && !state.isAnalyzing

  function handleTranslate() {
    if (!canTranslate) return
    const steps = parseCode(state.code)
    dispatch({
      type: 'TRANSLATE',
      payload: {
        steps,
        highlightedLines: steps.map(s => s.line),
      },
    })
    showToast(`Detected ${steps.length} transformation steps`)
  }

  return (
    <div className="flex flex-col items-center justify-center shrink-0 bg-surface-alt border-x border-border px-1">
      <button
        onClick={handleTranslate}
        disabled={!canTranslate}
        title="Translate Python to Alteryx workflow"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full
          bg-duke-gradient text-white shadow-md
          text-[10px] font-bold uppercase tracking-wide whitespace-nowrap
          transition-all duration-200
          ${canTranslate
            ? 'hover:shadow-lg hover:scale-105 cursor-pointer'
            : 'opacity-30 cursor-not-allowed'
          }`}
      >
        Transform
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

function AppContent() {
  return (
    <>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <CodeInputPanel />
        <Divider />
        <OutputPanel />
      </div>
      <Footer />
      <Toast />
      <OnboardingTutorial />
    </>
  )
}

function App() {
  return (
    <TranslatorProvider>
      <AppContent />
    </TranslatorProvider>
  )
}

export default App
