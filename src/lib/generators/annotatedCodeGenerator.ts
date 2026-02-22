import type { ParsedStep } from '@/types'

export function generateAnnotatedCode(code: string, steps: ParsedStep[]): string {
  const lines = code.split('\n')
  const stepsByLine: Record<number, ParsedStep> = {}
  steps.forEach(s => { stepsByLine[s.line] = s })

  const output: string[] = []
  lines.forEach((line, i) => {
    const lineNum = i + 1
    const step = stepsByLine[lineNum]
    if (step) {
      const cleanExplain = step.explain.replace(/<[^>]+>/g, '').substring(0, 80)
      output.push(`# ^ Alteryx Equivalent: ${step.alteryxTool} — ${cleanExplain}`)
    }
    output.push(line)
  })
  return output.join('\n')
}
