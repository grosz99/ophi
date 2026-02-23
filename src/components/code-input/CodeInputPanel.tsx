import { CodeEditor } from './CodeEditor'
import { SampleSelector } from './SampleSelector'
import { FileUpload } from './FileUpload'
import { useTranslator, useTranslatorDispatch } from '@/context/TranslatorContext'

export function CodeInputPanel() {
  const { code } = useTranslator()
  const dispatch = useTranslatorDispatch()

  function handleClear() {
    dispatch({ type: 'RESET' })
  }

  return (
    <div className="w-[42%] min-w-[300px] flex flex-col overflow-hidden shrink-0 bg-white">
      <div className="flex items-center gap-2.5 px-4 py-2 border-b-2 border-text-primary shrink-0">
        <h3 className="text-sm font-black uppercase tracking-wide flex-1">Python Code</h3>
        {code.trim().length > 0 && (
          <button
            onClick={handleClear}
            className="text-[10px] font-bold uppercase tracking-wide text-text-muted hover:text-red-600 transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
        <span className="text-[10px] text-text-muted font-semibold">Paste code or load a sample</span>
      </div>
      <FileUpload />
      <SampleSelector />
      <CodeEditor />
    </div>
  )
}
