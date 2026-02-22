import { useRef, useCallback } from 'react'
import { useTranslator, useTranslatorDispatch } from '@/context/TranslatorContext'

export function CodeEditor() {
  const state = useTranslator()
  const dispatch = useTranslatorDispatch()
  const lineNumRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const lines = state.code.split('\n')

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_CODE', payload: e.target.value })
  }, [dispatch])

  const handleScroll = useCallback(() => {
    if (lineNumRef.current && textareaRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Line numbers */}
      <div
        ref={lineNumRef}
        className="line-numbers w-11 shrink-0 bg-surface-alt text-text-muted pr-2 pt-4 text-right overflow-hidden border-r border-border"
      >
        {lines.map((_, i) => {
          const isHighlighted = state.highlightedLines.includes(i + 1)
          return (
            <div
              key={i}
              className={`block ${isHighlighted ? 'text-cat-prep font-bold' : ''}`}
            >
              {i + 1}
            </div>
          )
        })}
      </div>

      {/* Code textarea */}
      <textarea
        ref={textareaRef}
        value={state.code}
        onChange={handleInput}
        onScroll={handleScroll}
        className="code-editor flex-1 w-full h-full bg-white text-text-primary p-4 border-none"
        placeholder={`Paste your Python / pandas code here...\n\nExample:\nimport pandas as pd\n\ndf = pd.read_csv('sales.csv')\ndf = df[df['Sales'] > 1000]\ndf['Profit'] = df['Sales'] - df['Cost']\nresult = df.groupby('Region').agg({'Profit': 'sum'})\nresult.to_csv('output.csv')`}
        spellCheck={false}
      />
    </div>
  )
}
