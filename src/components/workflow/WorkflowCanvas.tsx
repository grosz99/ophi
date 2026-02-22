import { useTranslator, useTranslatorDispatch } from '@/context/TranslatorContext'
import { WorkflowNode } from './WorkflowNode'
import { NodeConnector } from './NodeConnector'

export function WorkflowCanvas() {
  const { steps, selectedStep } = useTranslator()
  const dispatch = useTranslatorDispatch()

  return (
    <div className="p-6 flex flex-col items-center gap-0 min-h-full">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center">
          {i > 0 && <NodeConnector />}
          <WorkflowNode
            step={step}
            index={i}
            selected={selectedStep === i}
            onClick={() => dispatch({ type: 'SELECT_STEP', payload: i })}
          />
        </div>
      ))}
    </div>
  )
}
