import { useTranslator } from '@/context/TranslatorContext'
import { EXCEL_MAPPINGS } from '@/lib/parser/excelMappings'
import type { ParsedStep } from '@/types'

/** Returns the display tool name and detail for a step, based on current terminology setting. */
export function useStepLabel(step: ParsedStep) {
  const { terminology } = useTranslator()
  if (terminology === 'excel') {
    const excel = EXCEL_MAPPINGS[step.toolKey]
    return { toolName: excel.tool, toolDetail: excel.detail }
  }
  return { toolName: step.alteryxTool, toolDetail: step.alteryxDetail }
}

/** Returns the current terminology label (for headers). */
export function useTermLabel() {
  const { terminology } = useTranslator()
  return terminology === 'excel' ? 'Excel' : 'Alteryx'
}
