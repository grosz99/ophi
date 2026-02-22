import { useMemo } from 'react'
import { useTranslator } from '@/context/TranslatorContext'
import { generateAnnotatedCode } from '@/lib/generators'
import { showToast } from '@/components/ui/Toast'

export function AnnotatedCodeView() {
  const { code, steps } = useTranslator()

  const annotated = useMemo(() => generateAnnotatedCode(code, steps), [code, steps])

  function handleCopy() {
    navigator.clipboard.writeText(annotated).then(() => showToast('Annotated code copied!'))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="bg-duke text-white px-4 py-1.5 flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-black tracking-widest uppercase opacity-70">Source</span>
        <span className="w-px h-3 bg-white/30" />
        <span className="text-[11px] font-semibold">Code with inline Alteryx annotations</span>
        <button
          onClick={handleCopy}
          className="ml-auto text-[10px] font-bold uppercase tracking-wide bg-white/15 hover:bg-white/25 px-2.5 py-0.5 transition-colors cursor-pointer"
        >
          Copy
        </button>
      </div>

      <pre className="flex-1 p-4 font-mono text-[12px] leading-[1.7] whitespace-pre-wrap overflow-y-auto overflow-x-auto">
        {annotated.split('\n').map((line, i) => {
          const isComment = line.trimStart().startsWith('# ^')
          return (
            <div key={i} className={isComment ? 'text-cat-prep font-semibold' : 'text-text-primary'}>
              {line}
            </div>
          )
        })}
      </pre>
    </div>
  )
}
