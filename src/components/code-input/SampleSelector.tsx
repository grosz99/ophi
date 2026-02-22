import { useState } from 'react'
import { useTranslatorDispatch } from '@/context/TranslatorContext'
import { SAMPLES } from '@/lib/samples'
import { parseCode } from '@/lib/parser'
import { showToast } from '@/components/ui/Toast'
import clsx from 'clsx'

export function SampleSelector() {
  const dispatch = useTranslatorDispatch()
  const [active, setActive] = useState<string | null>(null)

  function handleSelect(key: string) {
    setActive(key)
    const sample = SAMPLES[key]
    dispatch({ type: 'SET_CODE', payload: sample.code })

    // Auto-translate
    const steps = parseCode(sample.code)
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
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-wrap">
      <span className="text-xs text-text-muted font-semibold">Samples:</span>
      {Object.entries(SAMPLES).map(([key, { label }]) => (
        <button
          key={key}
          onClick={() => handleSelect(key)}
          className={clsx(
            'px-3 py-1 rounded-full text-xs border transition-all',
            active === key
              ? 'bg-duke-50 border-duke text-duke font-semibold'
              : 'bg-surface-alt border-border text-text-secondary hover:border-duke hover:text-duke'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
