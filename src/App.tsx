import { useRef, useEffect, useState } from 'react'
import { TranslatorProvider, useTranslator, useTranslatorDispatch } from '@/context/TranslatorContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CodeInputPanel } from '@/components/code-input/CodeInputPanel'
import { OutputPanel } from '@/components/views/OutputPanel'
import { Toast, showToast } from '@/components/ui/Toast'
import { OnboardingTutorial } from '@/components/ui/OnboardingTutorial'
import { parseCode } from '@/lib/parser'

function TranslateButton({ dividerRef }: { dividerRef: React.RefObject<HTMLDivElement | null> }) {
  const state = useTranslator()
  const dispatch = useTranslatorDispatch()
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  const canTranslate = state.code.trim().length > 0 && !state.isAnalyzing

  useEffect(() => {
    function updatePos() {
      const el = dividerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setPos({
        left: rect.left + rect.width / 2,
        top: rect.top + rect.height * 0.35,
      })
    }
    updatePos()
    window.addEventListener('resize', updatePos)
    return () => window.removeEventListener('resize', updatePos)
  }, [dividerRef])

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

  if (!pos) return null

  return (
    <button
      onClick={handleTranslate}
      disabled={!canTranslate}
      title="Translate Python to Alteryx workflow"
      className={`fixed w-10 h-10 rounded-full flex items-center justify-center
        bg-duke-gradient text-white shadow-md border-[3px] border-white
        transition-all duration-200
        ${canTranslate
          ? 'hover:shadow-lg hover:scale-110 cursor-pointer'
          : 'opacity-30 cursor-not-allowed'
        }`}
      style={{
        left: pos.left,
        top: pos.top,
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function AppContent() {
  const dividerRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <CodeInputPanel />
        <div ref={dividerRef} className="w-px bg-border shrink-0" />
        <OutputPanel />
      </div>
      <Footer />
      <Toast />
      <TranslateButton dividerRef={dividerRef} />
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
