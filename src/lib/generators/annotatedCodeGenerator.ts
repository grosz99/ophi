import type { ParsedStep, Terminology } from '@/types'
import { EXCEL_MAPPINGS } from '@/lib/parser/excelMappings'

export function generateAnnotatedCode(code: string, steps: ParsedStep[], terminology: Terminology = 'alteryx'): string {
  const lines = code.split('\n')
  const stepsByLine: Record<number, ParsedStep> = {}
  steps.forEach(s => { stepsByLine[s.line] = s })

  const label = terminology === 'excel' ? 'Excel' : 'Alteryx'

  const output: string[] = []
  lines.forEach((line, i) => {
    const lineNum = i + 1
    const step = stepsByLine[lineNum]
    if (step) {
      const toolName = terminology === 'excel' ? EXCEL_MAPPINGS[step.toolKey].tool : step.alteryxTool
      const cleanExplain = step.explain.replace(/<[^>]+>/g, '').substring(0, 80)
      output.push(`# ^ ${label} Equivalent: ${toolName} — ${cleanExplain}`)
    }
    output.push(line)
  })
  return output.join('\n')
}
