import { useRef } from 'react'
import { useTranslator, useTranslatorDispatch } from '@/context/TranslatorContext'
import { validateAndReadFile } from '@/lib/security/validation'
import { showToast } from '@/components/ui/Toast'

export function FileUpload() {
  const { code } = useTranslator()
  const dispatch = useTranslatorDispatch()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const result = await validateAndReadFile(file)
    if (!result.valid) {
      showToast(result.error || 'Invalid file')
      return
    }
    dispatch({ type: 'SET_CODE', payload: result.content! })
    showToast(`Loaded ${file.name}`)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleClear() {
    dispatch({ type: 'RESET' })
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border text-xs text-text-muted shrink-0">
      <button
        onClick={() => inputRef.current?.click()}
        className="text-duke font-semibold underline cursor-pointer hover:text-duke-light"
      >
        Upload .py or .ipynb
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".py,.ipynb"
        onChange={handleChange}
        className="hidden"
      />
      <span>or paste code above</span>
      {code.trim().length > 0 && (
        <button
          onClick={handleClear}
          className="ml-auto text-[10px] font-bold uppercase tracking-wide text-red-500 border border-red-300 px-2.5 py-0.5 rounded hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
        >
          Clear
        </button>
      )}
    </div>
  )
}
