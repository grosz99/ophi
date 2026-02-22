import type { ParsedStep } from '@/types'
import { sanitizeHTML } from '@/lib/security/sanitize'

interface Props {
  step: ParsedStep
  index: number
  onClick: () => void
  selected: boolean
}

const catLabel: Record<string, string> = {
  input: 'IN/OUT',
  prep: 'PREP',
  transform: 'TRANSFORM',
  parse: 'PARSE',
  join: 'JOIN',
  output: 'IN/OUT',
}

export function WorkflowNode({ step, index, onClick, selected }: Props) {
  return (
    <div
      onClick={onClick}
      className={`w-[480px] max-w-[95%] bg-white cursor-pointer transition-all duration-150 animate-node-in
        ${selected ? 'ring-2 ring-duke' : 'hover:bg-surface-alt'}
      `}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      {/* Top accent bar */}
      <div className="h-[3px]" style={{ backgroundColor: step.color }} />

      <div className="px-4 py-3">
        {/* Row 1: category tag + step number + tool badge */}
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-[9px] font-black tracking-widest text-white px-1.5 py-px"
            style={{ backgroundColor: step.color }}
          >
            {catLabel[step.cat] || step.cat.toUpperCase()}
          </span>
          <span className="text-[10px] text-text-muted font-semibold">Step {index + 1}</span>
          <span className="ml-auto text-[10px] font-bold text-text-muted">
            {step.alteryxTool}
          </span>
        </div>

        {/* Row 2: headline — tool name */}
        <h3 className="text-base font-black text-text-primary leading-tight mb-1">{step.tool}</h3>

        {/* Row 3: explanation */}
        <div
          className="text-xs text-text-secondary leading-relaxed mb-2"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(step.explain) }}
        />

        {/* Row 4: code snippet — tight monospace */}
        <div className="font-mono text-[11px] text-duke bg-surface-alt px-2.5 py-1.5 rounded overflow-x-auto whitespace-pre">
          {step.code}
        </div>
      </div>

      {/* Bottom rule */}
      <div className="h-px bg-border" />
    </div>
  )
}
