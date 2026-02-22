import { useTranslator } from '@/context/TranslatorContext'
import { ViewTabs } from './ViewTabs'
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas'
import { NodeDetail } from '@/components/workflow/NodeDetail'
import { EmptyState } from '@/components/workflow/EmptyState'
import { CheatSheetView } from './CheatSheetView'
import { RecommendationsView } from './RecommendationsView'
import { AnnotatedCodeView } from './AnnotatedCodeView'

export function OutputPanel() {
  const { steps, selectedStep, activeTab } = useTranslator()

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
