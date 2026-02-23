import type { ParsedStep } from '@/types'
import { useTranslatorDispatch } from '@/context/TranslatorContext'
import { sanitizeHTML } from '@/lib/security/sanitize'
import { useStepLabel, useTermLabel } from '@/lib/useTerminology'

interface Props {
  step: ParsedStep
}

const catLabel: Record<string, string> = {
  input: 'IN/OUT',
  prep: 'PREPARATION',
  transform: 'TRANSFORM',
  parse: 'PARSE',
  join: 'JOIN',
  output: 'IN/OUT',
}

export function NodeDetail({ step }: Props) {
  const dispatch = useTranslatorDispatch()
  const { headline, toolName, toolDetail } = useStepLabel(step)
  const termLabel = useTermLabel()

  return (
    <div className="overflow-y-auto">
      {/* Hero header */}
      <div className="px-5 pt-5 pb-4 border-b-2 border-text-primary">
        <button
          onClick={() => dispatch({ type: 'SELECT_STEP', payload: -1 })}
          className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-duke mb-3 block cursor-pointer transition-colors"
        >
          &larr; Back to workflow
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[9px] font-black tracking-widest text-white px-1.5 py-px"
            style={{ backgroundColor: step.color }}
          >
            {catLabel[step.cat] || step.cat.toUpperCase()}
          </span>
          <span className="text-[10px] text-text-muted font-semibold">Line {step.line}</span>
        </div>

        <h1 className="text-2xl font-black text-text-primary leading-tight mb-2">{headline}</h1>

        <div
          className="text-sm text-text-secondary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(step.explain) }}
        />
      </div>

      {/* Alteryx equivalent */}
      <div className="px-5 py-4 border-b border-border">
        <h4 className="text-[9px] font-black tracking-widest text-text-muted uppercase mb-2">{termLabel} Equivalent</h4>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-black text-white px-2.5 py-1"
            style={{ backgroundColor: step.color }}
          >
            {toolName}
          </span>
          <span className="text-sm text-text-secondary">{toolDetail}</span>
        </div>
      </div>

      {/* Code */}
      <div className="px-5 py-4">
        <h4 className="text-[9px] font-black tracking-widest text-text-muted uppercase mb-2">Source Code</h4>
        <pre className="bg-surface-alt px-3 py-2.5 font-mono text-sm leading-relaxed overflow-x-auto text-duke border-l-2 border-duke">
          {step.code}
        </pre>
      </div>
    </div>
  )
}
