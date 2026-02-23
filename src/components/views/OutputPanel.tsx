import { useTranslator, useTranslatorDispatch } from '@/context/TranslatorContext'
import { ViewTabs } from './ViewTabs'
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas'
import { NodeDetail } from '@/components/workflow/NodeDetail'
import { EmptyState } from '@/components/workflow/EmptyState'
import { CheatSheetView } from './CheatSheetView'
import { RecommendationsView } from './RecommendationsView'
import { AnnotatedCodeView } from './AnnotatedCodeView'
import { exportToPptx } from '@/lib/exportPptx'

export function OutputPanel() {
  const { steps, selectedStep, activeTab, terminology } = useTranslator()
  const dispatch = useTranslatorDispatch()

  function renderContent() {
    if (steps.length === 0) return <EmptyState />

    switch (activeTab) {
      case 'workflow':
        if (selectedStep >= 0) return <NodeDetail step={steps[selectedStep]} />
        return <WorkflowCanvas />
      case 'cheatsheet':
        return <CheatSheetView />
      case 'recommendations':
        return <RecommendationsView />
      case 'annotated':
        return <AnnotatedCodeView />
      default:
        return <EmptyState />
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header — editorial style */}
      <div className="flex items-center gap-2.5 px-4 py-2 border-b-2 border-text-primary bg-white shrink-0">
        <h3 className="text-sm font-black uppercase tracking-wide flex-1">Explain To Me</h3>
        {/* Alteryx / Excel toggle */}
        <div className="flex bg-surface-alt rounded overflow-hidden border border-border">
          <button
            onClick={() => dispatch({ type: 'SET_TERMINOLOGY', payload: 'alteryx' })}
            className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer border-0 ${
              terminology === 'alteryx' ? 'bg-duke text-white' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Alteryx
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_TERMINOLOGY', payload: 'excel' })}
            className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer border-0 ${
              terminology === 'excel' ? 'bg-duke text-white' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Excel
          </button>
        </div>
        {steps.length > 0 && (
          <button
            onClick={() => exportToPptx(steps, terminology)}
            className="text-[10px] font-bold uppercase tracking-wide text-text-muted hover:text-duke transition-colors cursor-pointer"
          >
            Export PPT
          </button>
        )}
        {steps.length > 0 && (
          <span className="text-[10px] font-black tracking-widest text-white bg-duke px-2 py-0.5">
            {steps.length} STEPS
          </span>
        )}
      </div>
      <ViewTabs />
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}
