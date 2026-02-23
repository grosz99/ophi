import { useTranslator } from '@/context/TranslatorContext'
import { stripHTML } from '@/lib/security/sanitize'
import { showToast } from '@/components/ui/Toast'
import { EXCEL_MAPPINGS } from '@/lib/parser/excelMappings'
import { useTermLabel } from '@/lib/useTerminology'

export function CheatSheetView() {
  const { steps, terminology } = useTranslator()
  const termLabel = useTermLabel()

  function getToolName(step: typeof steps[0]) {
    return terminology === 'excel' ? EXCEL_MAPPINGS[step.toolKey].tool : step.alteryxTool
  }

  function handleCopy() {
    const text = steps.map((s, i) =>
      `Step ${i + 1}: ${s.code}\n  ${termLabel}: ${getToolName(s)} — ${stripHTML(s.explain)}\n`
    ).join('\n')
    navigator.clipboard.writeText(text).then(() => showToast('Cheat sheet copied!'))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="bg-duke text-white px-4 py-1.5 flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-black tracking-widest uppercase opacity-70">Mapping</span>
        <span className="w-px h-3 bg-white/30" />
        <span className="text-[11px] font-semibold">{steps.length} operations translated</span>
        <button
          onClick={handleCopy}
          className="ml-auto text-[10px] font-bold uppercase tracking-wide bg-white/15 hover:bg-white/25 px-2.5 py-0.5 transition-colors cursor-pointer"
        >
          Copy
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[40px_1fr_28px_1fr] gap-0 px-4 py-1.5 bg-surface-alt border-b border-border text-[9px] font-black tracking-widest text-text-muted uppercase shrink-0">
        <span>#</span>
        <span>Python</span>
        <span />
        <span>{termLabel}</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {steps.map((step, i) => (
          <div
            key={i}
            className="grid grid-cols-[40px_1fr_28px_1fr] gap-0 px-4 py-2.5 border-b border-border-light items-start hover:bg-surface-alt transition-colors"
          >
            {/* Step number */}
            <span className="text-xs font-black text-text-muted">{i + 1}</span>

            {/* Python code */}
            <span className="font-mono text-[11px] text-text-primary min-w-0 break-all leading-relaxed pr-2">
              {step.code.length > 55 ? step.code.substring(0, 55) + '...' : step.code}
            </span>

            {/* Arrow */}
            <span className="text-text-muted text-xs font-bold text-center">&rarr;</span>

            {/* Tool mapping */}
            <div className="min-w-0">
              <span className="text-sm font-black leading-tight block" style={{ color: step.color }}>
                {getToolName(step)}
              </span>
              <p className="text-[11px] text-text-muted leading-snug mt-0.5">
                {stripHTML(step.explain).substring(0, 70)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
