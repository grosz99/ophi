import { useMemo } from 'react'
import { useTranslator, useTranslatorDispatch } from '@/context/TranslatorContext'
import { generateRecommendations, type Recommendation } from '@/lib/generators/recommendationsGenerator'
import { showToast } from '@/components/ui/Toast'

const severityConfig: Record<Recommendation['severity'], { accent: string; tag: string; tagBg: string }> = {
  warning: { accent: '#dc2626', tag: 'ALERT', tagBg: 'bg-red-600' },
  improvement: { accent: '#003087', tag: 'UPGRADE', tagBg: 'bg-duke' },
  info: { accent: '#64748b', tag: 'NOTE', tagBg: 'bg-slate-500' },
}

export function RecommendationsView() {
  const { code, steps } = useTranslator()
  const dispatch = useTranslatorDispatch()
  const recommendations = useMemo(() => generateRecommendations(code, steps), [code, steps])

  function handleApply(fix: (code: string) => string) {
    const fixed = fix(code)
    dispatch({ type: 'SET_CODE', payload: fixed })
    showToast('Fix applied to code')
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-base font-bold text-text-primary mb-1">All clear.</p>
        <p className="text-sm text-text-muted">No issues detected in your pipeline.</p>
      </div>
    )
  }

  // Lead story = first warning, or first item
  const leadIdx = recommendations.findIndex(r => r.severity === 'warning')
  const lead = leadIdx >= 0 ? recommendations[leadIdx] : recommendations[0]
  const rest = recommendations.filter(r => r !== lead)
  const leadConfig = severityConfig[lead.severity]

  return (
    <div className="flex flex-col h-full">
      {/* Ticker bar */}
      <div className="bg-duke text-white px-4 py-1.5 flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-black tracking-widest uppercase opacity-70">Analysis</span>
        <span className="w-px h-3 bg-white/30" />
        <span className="text-[11px] font-semibold">
          {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} found
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Lead story — big headline */}
        <div className="border-b-2 border-text-primary px-5 pt-5 pb-4">
          <span className={`inline-block text-[10px] font-black tracking-widest text-white px-2 py-0.5 mb-2 ${leadConfig.tagBg}`}>
            {leadConfig.tag}
          </span>
          <h2 className="text-xl font-black text-text-primary leading-tight mb-2">{lead.title}</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{lead.description}</p>
          <div className="flex items-center gap-3 mt-2">
            {lead.relatedStep !== undefined && (
              <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                Step {lead.relatedStep + 1} &middot; {steps[lead.relatedStep]?.tool}
              </p>
            )}
            {lead.fix && (
              <button
                onClick={() => handleApply(lead.fix!)}
                className="ml-auto text-[10px] font-bold uppercase tracking-wide bg-duke text-white px-3 py-1 hover:bg-duke/80 transition-colors cursor-pointer"
              >
                Apply Fix
              </button>
            )}
          </div>
        </div>

        {/* Remaining items — stacked headlines */}
        {rest.map((rec, i) => {
          const cfg = severityConfig[rec.severity]
          return (
            <div
              key={i}
              className="px-5 py-3.5 border-b border-border flex gap-4 items-start hover:bg-surface-alt transition-colors"
            >
              <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: cfg.accent }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-black tracking-widest text-white px-1.5 py-px ${cfg.tagBg}`}>
                    {cfg.tag}
                  </span>
                  {rec.relatedStep !== undefined && (
                    <span className="text-[10px] text-text-muted font-semibold">
                      Step {rec.relatedStep + 1}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-text-primary leading-snug mb-0.5">{rec.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{rec.description}</p>
                {rec.fix && (
                  <button
                    onClick={() => handleApply(rec.fix!)}
                    className="mt-1.5 text-[9px] font-bold uppercase tracking-wide bg-duke text-white px-2.5 py-0.5 hover:bg-duke/80 transition-colors cursor-pointer"
                  >
                    Apply Fix
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
