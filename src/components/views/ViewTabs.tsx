import type { ViewTab } from '@/types'
import { useTranslator, useTranslatorDispatch } from '@/context/TranslatorContext'
import { exportToPptx } from '@/lib/exportPptx'
import clsx from 'clsx'

const TABS: { key: ViewTab; label: string }[] = [
  { key: 'workflow', label: 'Workflow' },
  { key: 'cheatsheet', label: 'Cheat Sheet' },
  { key: 'recommendations', label: 'Analysis' },
  { key: 'annotated', label: 'Annotated' },
]

export function ViewTabs() {
  const { activeTab, steps, terminology } = useTranslator()
  const dispatch = useTranslatorDispatch()

  return (
    <div className="flex gap-0 border-b border-border shrink-0 bg-surface-alt">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => dispatch({ type: 'SET_TAB', payload: tab.key })}
          className={clsx(
            'px-4 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0',
            activeTab === tab.key
              ? 'text-duke border-b-duke bg-white'
              : 'text-text-muted border-b-transparent hover:text-text-primary'
          )}
        >
          {tab.label}
        </button>
      ))}
      {steps.length > 0 && (
        <button
          onClick={() => exportToPptx(steps, terminology)}
          className="ml-auto mr-3 self-center text-[10px] font-bold uppercase tracking-wide text-duke border border-duke px-2.5 py-0.5 rounded hover:bg-duke hover:text-white transition-colors cursor-pointer"
        >
          Export PPT
        </button>
      )}
    </div>
  )
}
